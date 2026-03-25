import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { subHours } from 'date-fns';
import { RequestStatus, RequestType } from '@shiftsync/shared';
import { ShiftRequest, ShiftAssignment, Shift, User } from '../database/models';
import { ShiftRepository } from '../database/repositories/shift.repository';
import { ShiftAssignmentRepository } from '../database/repositories/shift-assignment.repository';
import { ShiftRequestRepository } from '../database/repositories/shift-request.repository';
import { LocationRepository } from '../database/repositories/location.repository';
import { PermissionsService } from '../permissions/permissions.service';
import { ConstraintsService, ConstraintResult } from '../constraints/constraints.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway, WS_EVENTS } from '../events/events.gateway';
import { getShiftFirstStart, getShiftTimeZone } from '../common/shift-time.utils';

const MAX_PENDING_PER_STAFF = 3;
const DROP_EXPIRY_HOURS = 24;

@Injectable()
export class RequestsService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly requestRepository: ShiftRequestRepository,
    private readonly assignmentRepository: ShiftAssignmentRepository,
    private readonly shiftRepository: ShiftRepository,
    private readonly locationRepository: LocationRepository,
    private readonly permissions: PermissionsService,
    private readonly constraints: ConstraintsService,
    private readonly notifications: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  private async notifyManagersForLocation(
    locationId: string,
    type: string,
    title: string,
    body: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const managerIds = await this.locationRepository.getManagerUserIdsByLocationId(locationId);
    await Promise.all(
      managerIds.map((managerId) =>
        this.notifications.createAndPush(managerId, type, title, body, payload),
      ),
    );
  }

  private async countPendingForStaff(userId: string): Promise<number> {
    const assignments = await this.assignmentRepository.findAllByUserId(userId, ['id']);
    const assignmentIds = assignments.map((a) => a.id);
    return this.requestRepository.countPendingByAssignmentIds(assignmentIds);
  }

  private isDropExpired(shiftStartAt: Date): boolean {
    const expiry = subHours(shiftStartAt, DROP_EXPIRY_HOURS);
    return Date.now() >= expiry.getTime();
  }

  private async canManageRequest(user: User, request: ShiftRequest): Promise<boolean> {
    const assignment = await this.assignmentRepository.findByIdWithShift(request.assignmentId);
    if (!assignment) return false;
    const shift = (assignment as { shift: Shift }).shift;
    if (!shift) return false;
    return this.permissions.canManageLocation(user, shift.locationId);
  }

  async createSwap(assignmentId: string, user: User): Promise<ShiftRequest> {
    const assignment = await this.assignmentRepository.findByIdOrFailWithShift(assignmentId);
    if (assignment.userId !== user.id) {
      throw new ForbiddenException('You can only create a swap for your own assignment');
    }
    const count = await this.countPendingForStaff(user.id);
    if (count >= MAX_PENDING_PER_STAFF) {
      throw new BadRequestException(`Maximum ${MAX_PENDING_PER_STAFF} pending swap/drop requests per staff`);
    }
    const created = await this.requestRepository.create({
      type: RequestType.Swap,
      assignmentId,
      status: RequestStatus.Pending,
    });
    const shift = (assignment as { shift: Shift }).shift;
    this.eventsGateway.emitToLocation(shift.locationId, WS_EVENTS.SWAP_REQUEST, {
      requestId: created.id,
      assignmentId,
    });
    await this.notifyManagersForLocation(
      shift.locationId,
      'swap_requested',
      'Swap request submitted',
      'A staff member requested a shift swap.',
      { requestId: created.id, assignmentId, locationId: shift.locationId },
    );
    return created;
  }

  async createDrop(assignmentId: string, user: User): Promise<ShiftRequest> {
    const assignment = await this.assignmentRepository.findByIdOrFailWithShift(assignmentId);
    const shift = (assignment as { shift: Shift }).shift;
    const firstStart = getShiftFirstStart(shift as any, getShiftTimeZone(shift as any));
    if (!firstStart) {
      throw new BadRequestException('Unable to determine shift start');
    }
    if (this.isDropExpired(firstStart)) {
      throw new BadRequestException('Drop request cannot be created within 24h of shift start');
    }
    if (assignment.userId !== user.id) {
      throw new ForbiddenException('You can only create a drop for your own assignment');
    }
    const count = await this.countPendingForStaff(user.id);
    if (count >= MAX_PENDING_PER_STAFF) {
      throw new BadRequestException(`Maximum ${MAX_PENDING_PER_STAFF} pending swap/drop requests per staff`);
    }
    const created = await this.requestRepository.create({
      type: RequestType.Drop,
      assignmentId,
      status: RequestStatus.Pending,
    });
    this.eventsGateway.emitToLocation(shift.locationId, WS_EVENTS.DROP_REQUEST, {
      requestId: created.id,
      assignmentId,
    });
    await this.notifyManagersForLocation(
      shift.locationId,
      'drop_requested',
      'Drop request submitted',
      'A staff member offered a shift for coverage.',
      { requestId: created.id, assignmentId, locationId: shift.locationId },
    );
    return created;
  }

  async acceptSwap(
    requestId: string,
    counterpartAssignmentId: string,
    user: User,
  ): Promise<{ request: ShiftRequest; constraintError?: ConstraintResult }> {
    const request = await this.requestRepository.findByPkWithAssignmentAndShift(requestId);
    if (!request || request.type !== RequestType.Swap || request.status !== RequestStatus.Pending) {
      throw new NotFoundException('Swap request not found or not pending');
    }
    const fromAssignment = (request as { assignment: ShiftAssignment & { shift: Shift } }).assignment;
    const fromShift = fromAssignment.shift;
    const toAssignment = await this.assignmentRepository.findByIdWithShift(counterpartAssignmentId);
    if (!toAssignment) throw new NotFoundException('Counterpart assignment not found');
    if (toAssignment.userId !== user.id) {
      throw new ForbiddenException('You can only accept with your own assignment');
    }
    const toShift = (toAssignment as { shift: Shift }).shift;
    const fromUser = fromAssignment.userId;
    const toUser = toAssignment.userId;
    const r1 = await this.constraints.validateAssignment(
      toUser,
      fromShift.locationId,
      fromAssignment.skillId,
      fromShift,
    );
    if (!r1.valid) {
      const alternatives = await this.constraints.getAlternatives(
        fromShift.locationId,
        fromAssignment.skillId,
        fromShift,
        toUser,
      );
      return { request: null as any, constraintError: { ...r1, alternatives } };
    }
    const r2 = await this.constraints.validateAssignment(
      fromUser,
      toShift.locationId,
      toAssignment.skillId,
      toShift,
    );
    if (!r2.valid) {
      const alternatives = await this.constraints.getAlternatives(
        toShift.locationId,
        toAssignment.skillId,
        toShift,
        fromUser,
      );
      return { request: null as any, constraintError: { ...r2, alternatives } };
    }
    const accepted = await this.requestRepository.updateAcceptSwapIfPending(requestId, counterpartAssignmentId);
    if (!accepted) {
      throw new ConflictException('Swap request is no longer pending or was already processed');
    }
    const updated = await this.requestRepository.findByPkWithAssignmentAndCounterpartAndClaimer(requestId);
    await this.notifications.createAndPush(
      fromUser,
      'swap_accepted',
      'Swap accepted',
      'Your swap request has been accepted and awaits manager approval.',
      { requestId, counterpartAssignmentId },
    );
    this.eventsGateway.emitToLocation(fromShift.locationId, WS_EVENTS.SWAP_RESOLVED, {
      requestId,
      status: 'accepted',
    });
    return { request: updated as ShiftRequest };
  }

  async acceptDrop(
    requestId: string,
    user: User,
  ): Promise<{ request: ShiftRequest; constraintError?: ConstraintResult }> {
    const request = await this.requestRepository.findByPkWithAssignmentAndShift(requestId);
    if (!request || request.type !== RequestType.Drop || request.status !== RequestStatus.Pending) {
      throw new NotFoundException('Drop request not found or not pending');
    }
    const assignment = (request as { assignment: ShiftAssignment & { shift: Shift } }).assignment;
    const shift = assignment.shift;
    const firstStart = getShiftFirstStart(shift as any, getShiftTimeZone(shift as any));
    if (!firstStart) {
      throw new BadRequestException('Unable to determine shift start');
    }
    if (this.isDropExpired(firstStart)) {
      throw new BadRequestException('Drop has expired (within 24h of shift)');
    }
    const result = await this.constraints.validateAssignment(
      user.id,
      shift.locationId,
      assignment.skillId,
      shift,
    );
    if (!result.valid) {
      const alternatives = await this.constraints.getAlternatives(
        shift.locationId,
        assignment.skillId,
        shift,
      );
      return { request: null as any, constraintError: { ...result, alternatives } };
    }
    const acceptedDrop = await this.requestRepository.updateAcceptDropIfPending(requestId, user.id);
    if (!acceptedDrop) {
      throw new ConflictException('Drop request is no longer pending or was already processed');
    }
    const updated = await this.requestRepository.findByPkWithAssignmentAndCounterpartAndClaimer(requestId);
    await this.notifications.createAndPush(
      assignment.userId,
      'drop_claimed',
      'Drop request claimed',
      'Your drop request has been claimed and awaits manager approval.',
      { requestId, claimerUserId: user.id },
    );
    this.eventsGateway.emitToLocation(shift.locationId, WS_EVENTS.DROP_RESOLVED, {
      requestId,
      status: 'accepted',
    });
    return { request: updated as ShiftRequest };
  }

  async approve(requestId: string, user: User): Promise<ShiftRequest> {
    await this.sequelize.transaction(async (transaction) => {
      const request = await this.requestRepository.findByPkWithFullForApproveLocked(requestId, transaction);
      if (!request) throw new NotFoundException('Request not found');
      if (request.status !== RequestStatus.Accepted) {
        throw new ConflictException('Only accepted requests can be approved');
      }
      const can = await this.canManageRequest(user, request);
      if (!can) throw new ForbiddenException('You cannot approve this request');
      if (request.type === RequestType.Swap) {
        const fromA = (request as { assignment: ShiftAssignment }).assignment;
        const toA = (request as { counterpartAssignment: ShiftAssignment }).counterpartAssignment;
        const fromUserId = fromA.userId;
        const toUserId = toA.userId;
        await fromA.update({ userId: toUserId, version: fromA.version + 1 }, { transaction });
        await toA.update({ userId: fromUserId, version: toA.version + 1 }, { transaction });
      } else {
        const assignment = (request as { assignment: ShiftAssignment }).assignment;
        const claimer = (request as { claimer: User }).claimer;
        await assignment.update(
          {
            userId: claimer.id,
            version: assignment.version + 1,
          },
          { transaction },
        );
      }
      await request.update({ status: RequestStatus.Approved }, { transaction });
    });
    const updated = await this.requestRepository.findByPkWithFullForApprove(requestId);
    if (updated?.type === RequestType.Drop) {
      const assignment = (updated as { assignment?: ShiftAssignment })?.assignment;
      const claimer = (updated as { claimer?: User })?.claimer;
      if (assignment?.userId) {
        await this.notifications.createAndPush(
          assignment.userId,
          'request_approved',
          'Request approved',
          'Your coverage request was approved by a manager.',
          { requestId },
        );
      }
      if (claimer?.id) {
        await this.notifications.createAndPush(
          claimer.id,
          'request_approved',
          'Request approved',
          'Your accepted coverage request was approved.',
          { requestId },
        );
      }
    }
    return updated as ShiftRequest;
  }

  async reject(requestId: string, user: User): Promise<ShiftRequest> {
    const request = await this.requestRepository.findByPk(requestId);
    if (!request) throw new NotFoundException('Request not found');
    const can = await this.canManageRequest(user, request);
    if (!can) throw new ForbiddenException('You cannot reject this request');
    await this.requestRepository.updateStatus(requestId, RequestStatus.Rejected);
    const updated = await this.requestRepository.findByPk(requestId);
    const withAssignment = await this.requestRepository.findByPkWithAssignmentAndShift(requestId);
    const ownerUserId = (withAssignment as { assignment?: ShiftAssignment })?.assignment?.userId;
    if (ownerUserId) {
      await this.notifications.createAndPush(
        ownerUserId,
        'request_rejected',
        'Request rejected',
        'Your request was rejected by a manager.',
        { requestId },
      );
    }
    return updated as ShiftRequest;
  }

  async cancel(requestId: string, user: User): Promise<ShiftRequest> {
    const request = await this.requestRepository.findByPkWithAssignment(requestId);
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== RequestStatus.Pending && request.status !== RequestStatus.Accepted) {
      throw new BadRequestException('Only pending or accepted requests can be cancelled');
    }
    const assignment = (request as { assignment: ShiftAssignment }).assignment;
    const canManage = await this.canManageRequest(user, request);
    const isOwner = assignment?.userId === user.id;
    if (!canManage && !isOwner) {
      throw new ForbiddenException('You cannot cancel this request');
    }
    await this.requestRepository.updateStatus(requestId, RequestStatus.Cancelled);
    const updated = await this.requestRepository.findByPk(requestId);
    const withAssignment = await this.requestRepository.findByPkWithAssignmentAndShift(requestId);
    const shift = (withAssignment as { assignment?: ShiftAssignment & { shift?: Shift } })?.assignment?.shift;
    if (shift) {
      this.eventsGateway.emitToLocation(shift.locationId, WS_EVENTS.SWAP_RESOLVED, {
        requestId,
        status: 'cancelled',
      });
    }
    return updated as ShiftRequest;
  }

  async cancelPendingByShiftId(shiftId: string): Promise<number> {
    const assignments = await this.assignmentRepository.findAllByShiftId(shiftId, ['id']);
    const ids = assignments.map((a) => a.id);
    if (ids.length === 0) return 0;
    const active = await this.requestRepository.findAllPendingAndAcceptedByAssignmentIds(ids);
    await Promise.all(
      active.map(async (request) => {
        await this.requestRepository.updateStatus(request.id, RequestStatus.Cancelled);
        const ownerId = (request as { assignment?: ShiftAssignment })?.assignment?.userId;
        if (ownerId) {
          await this.notifications.createAndPush(
            ownerId,
            'request_auto_cancelled',
            'Request cancelled',
            'Your pending/accepted request was cancelled because the shift was edited.',
            { requestId: request.id, shiftId },
          );
        }
      }),
    );
    return active.length;
  }

  async findMyRequests(user: User): Promise<ShiftRequest[]> {
    const assignments = await this.assignmentRepository.findAllByUserId(user.id, ['id']);
    const ids = assignments.map((a) => a.id);
    return this.requestRepository.findAllByAssignmentIds(ids);
  }

  /** Pending drop requests that staff can accept (pick up). */
  async findAvailableDrops(user: User): Promise<ShiftRequest[]> {
    const all = await this.requestRepository.findAllPendingDrops();
    const scope = await this.permissions.getLocationScopeForRead(user);
    if (scope === null) return all;
    if (scope.length === 0) return [];
    return all.filter((r) => {
      const shift = (r as { assignment?: { shift?: Shift } }).assignment?.shift;
      return shift && scope.includes(shift.locationId);
    });
  }

  /** Pending swap requests that staff can accept (excludes own requests). */
  async findAvailableSwaps(user: User): Promise<ShiftRequest[]> {
    const all = await this.requestRepository.findAllPendingSwaps();
    const rows = all.filter((r) => {
      const a = (r as { assignment?: { userId: string } }).assignment;
      return a && a.userId !== user.id;
    });
    const scope = await this.permissions.getLocationScopeForRead(user);
    if (scope === null) return rows;
    if (scope.length === 0) return [];
    return rows.filter((r) => {
      const shift = (r as { assignment?: { shift?: Shift } }).assignment?.shift;
      return shift && scope.includes(shift.locationId);
    });
  }

  async findPendingForManager(user: User): Promise<ShiftRequest[]> {
    const locationIds = await this.permissions.getManagerLocationIds(user);
    if (locationIds && locationIds.length === 0) return [];
    if (locationIds === null) {
      return this.requestRepository.findAllPendingAndAccepted();
    }
    const shifts = await this.shiftRepository.findAllByLocationIds(locationIds);
    const shiftIds = shifts.map((s) => s.id);
    const assignments = await Promise.all(
      shiftIds.map((sid) => this.assignmentRepository.findAllByShiftId(sid, ['id'])),
    );
    const assignmentIds = assignments.flat().map((a) => a.id);
    if (assignmentIds.length === 0) return [];
    return this.requestRepository.findAllPendingAndAcceptedByAssignmentIds(assignmentIds);
  }
}
