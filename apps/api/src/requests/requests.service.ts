import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { RequestStatus, RequestType } from '@shiftsync/shared';
import { ShiftRequest, ShiftAssignment, Shift, User } from '../database/models';
import { ShiftRepository } from '../database/repositories/shift.repository';
import { ShiftAssignmentRepository } from '../database/repositories/shift-assignment.repository';
import { ShiftRequestRepository } from '../database/repositories/shift-request.repository';
import { PermissionsService } from '../permissions/permissions.service';
import { ConstraintsService, ConstraintResult } from '../constraints/constraints.service';

const MAX_PENDING_PER_STAFF = 3;
const DROP_EXPIRY_HOURS = 24;

@Injectable()
export class RequestsService {
  constructor(
    private readonly requestRepository: ShiftRequestRepository,
    private readonly assignmentRepository: ShiftAssignmentRepository,
    private readonly shiftRepository: ShiftRepository,
    private readonly permissions: PermissionsService,
    private readonly constraints: ConstraintsService,
  ) {}

  private async countPendingForStaff(userId: string): Promise<number> {
    const assignments = await this.assignmentRepository.findAllByUserId(userId, ['id']);
    const assignmentIds = assignments.map((a) => a.id);
    return this.requestRepository.countPendingByAssignmentIds(assignmentIds);
  }

  private isDropExpired(shiftStartAt: Date): boolean {
    const expiry = new Date(shiftStartAt.getTime() - DROP_EXPIRY_HOURS * 60 * 60 * 1000);
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
    return this.requestRepository.create({
      type: RequestType.Swap,
      assignmentId,
      status: RequestStatus.Pending,
    });
  }

  async createDrop(assignmentId: string, user: User): Promise<ShiftRequest> {
    const assignment = await this.assignmentRepository.findByIdOrFailWithShift(assignmentId);
    const shift = (assignment as { shift: Shift }).shift;
    if (this.isDropExpired(shift.startAt)) {
      throw new BadRequestException('Drop request cannot be created within 24h of shift start');
    }
    if (assignment.userId !== user.id) {
      throw new ForbiddenException('You can only create a drop for your own assignment');
    }
    const count = await this.countPendingForStaff(user.id);
    if (count >= MAX_PENDING_PER_STAFF) {
      throw new BadRequestException(`Maximum ${MAX_PENDING_PER_STAFF} pending swap/drop requests per staff`);
    }
    return this.requestRepository.create({
      type: RequestType.Drop,
      assignmentId,
      status: RequestStatus.Pending,
    });
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
      fromShift.startAt,
      fromShift.endAt,
    );
    if (!r1.valid) {
      const alternatives = await this.constraints.getAlternatives(
        fromShift.locationId,
        fromAssignment.skillId,
        fromShift.startAt,
        fromShift.endAt,
        toUser,
      );
      return { request: null as any, constraintError: { ...r1, alternatives } };
    }
    const r2 = await this.constraints.validateAssignment(
      fromUser,
      toShift.locationId,
      toAssignment.skillId,
      toShift.startAt,
      toShift.endAt,
    );
    if (!r2.valid) {
      const alternatives = await this.constraints.getAlternatives(
        toShift.locationId,
        toAssignment.skillId,
        toShift.startAt,
        toShift.endAt,
        fromUser,
      );
      return { request: null as any, constraintError: { ...r2, alternatives } };
    }
    await this.requestRepository.updateAcceptSwap(requestId, counterpartAssignmentId);
    const updated = await this.requestRepository.findByPkWithAssignmentAndCounterpartAndClaimer(requestId);
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
    if (this.isDropExpired(shift.startAt)) {
      throw new BadRequestException('Drop has expired (within 24h of shift)');
    }
    const result = await this.constraints.validateAssignment(
      user.id,
      shift.locationId,
      assignment.skillId,
      shift.startAt,
      shift.endAt,
    );
    if (!result.valid) {
      const alternatives = await this.constraints.getAlternatives(
        shift.locationId,
        assignment.skillId,
        shift.startAt,
        shift.endAt,
      );
      return { request: null as any, constraintError: { ...result, alternatives } };
    }
    await this.requestRepository.updateAcceptDrop(requestId, user.id);
    const updated = await this.requestRepository.findByPkWithAssignmentAndCounterpartAndClaimer(requestId);
    return { request: updated as ShiftRequest };
  }

  async approve(requestId: string, user: User): Promise<ShiftRequest> {
    const request = await this.requestRepository.findByPkWithFullForApprove(requestId);
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== RequestStatus.Accepted) {
      throw new BadRequestException('Only accepted requests can be approved');
    }
    const can = await this.canManageRequest(user, request);
    if (!can) throw new ForbiddenException('You cannot approve this request');
    if (request.type === RequestType.Swap) {
      const fromA = (request as { assignment: ShiftAssignment }).assignment;
      const toA = (request as { counterpartAssignment: ShiftAssignment }).counterpartAssignment;
      const fromUserId = fromA.userId;
      const toUserId = toA.userId;
      await this.assignmentRepository.updateUserAndVersion(fromA.id, toUserId, fromA.version + 1);
      await this.assignmentRepository.updateUserAndVersion(toA.id, fromUserId, toA.version + 1);
    } else {
      const assignment = (request as { assignment: ShiftAssignment }).assignment;
      const claimer = (request as { claimer: User }).claimer;
      await this.assignmentRepository.updateUserAndVersion(
        assignment.id,
        claimer.id,
        assignment.version + 1,
      );
    }
    await this.requestRepository.updateStatus(requestId, RequestStatus.Approved);
    const updated = await this.requestRepository.findByPkWithFullForApprove(requestId);
    return updated as ShiftRequest;
  }

  async reject(requestId: string, user: User): Promise<ShiftRequest> {
    const request = await this.requestRepository.findByPk(requestId);
    if (!request) throw new NotFoundException('Request not found');
    const can = await this.canManageRequest(user, request);
    if (!can) throw new ForbiddenException('You cannot reject this request');
    await this.requestRepository.updateStatus(requestId, RequestStatus.Rejected);
    const updated = await this.requestRepository.findByPk(requestId);
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
    return updated as ShiftRequest;
  }

  async cancelPendingByShiftId(shiftId: string): Promise<number> {
    const assignments = await this.assignmentRepository.findAllByShiftId(shiftId, ['id']);
    const ids = assignments.map((a) => a.id);
    return this.requestRepository.cancelPendingByAssignmentIds(ids);
  }

  async findMyRequests(user: User): Promise<ShiftRequest[]> {
    const assignments = await this.assignmentRepository.findAllByUserId(user.id, ['id']);
    const ids = assignments.map((a) => a.id);
    return this.requestRepository.findAllByAssignmentIds(ids);
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
