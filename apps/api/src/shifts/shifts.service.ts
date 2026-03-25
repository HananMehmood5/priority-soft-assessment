import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { AuditAction, AuditEntityType, UserRole } from '@shiftsync/shared';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Shift, ShiftAssignment, User } from '../database/models';
import { ShiftRepository } from '../database/repositories/shift.repository';
import { ShiftAssignmentRepository } from '../database/repositories/shift-assignment.repository';
import { LocationRepository } from '../database/repositories/location.repository';
import { PermissionsService } from '../permissions/permissions.service';
import { ConstraintsService, ConstraintResult } from '../constraints/constraints.service';
import { RequestsService } from '../requests/requests.service';
import { OvertimeService } from '../overtime/overtime.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway, WS_EVENTS } from '../events/events.gateway';
import { expandShiftToIntervals, getShiftTimeZone } from '../common/shift-time.utils';
import { addDays } from '../common/utils/date.utils';

const DEFAULT_CUTOFF_HOURS = 48;

@Injectable()
export class ShiftsService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly shiftRepository: ShiftRepository,
    private readonly assignmentRepository: ShiftAssignmentRepository,
    private readonly locationRepository: LocationRepository,
    private readonly permissions: PermissionsService,
    private readonly constraints: ConstraintsService,
    private readonly config: ConfigService,
    private readonly requestsService: RequestsService,
    private readonly overtimeService: OvertimeService,
    private readonly auditService: AuditService,
    private readonly notifications: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  private getCutoffHours(): number {
    return this.config.get<number>('CUTOFF_HOURS', DEFAULT_CUTOFF_HOURS);
  }

  private isPastCutoff(shiftStartAt: Date): boolean {
    const cutoffMs = this.getCutoffHours() * 60 * 60 * 1000;
    return Date.now() >= shiftStartAt.getTime() - cutoffMs;
  }

  /**
   * Sequelize date-only fields can come back as either Date or string depending on dialect/config.
   * Normalize both shapes to yyyy-mm-dd for safe comparisons.
   */
  private toDateOnly(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return value.includes('T') ? value.slice(0, 10) : value;
  }

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

  private async notifyAssignedStaffForShift(
    shiftId: string,
    locationId: string,
    type: string,
    title: string,
    body: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const assignments = await this.assignmentRepository.findAllByShiftId(shiftId, ['userId']);
    const uniqueUserIds = [...new Set(assignments.map((a) => (a as { userId: string }).userId))];
    await Promise.all(
      uniqueUserIds.map((uid) =>
        this.notifications.createAndPush(uid, type, title, body, payload),
      ),
    );
  }

  /** Derive a single concrete interval covering the whole shift template. */
  private getTemplateBounds(shift: Shift): { start: Date; end: Date } {
    const intervals = expandShiftToIntervals(shift as any, undefined, getShiftTimeZone(shift as any));
    if (intervals.length === 0) {
      // Fallback to previous behavior if the template is invalid/empty.
      const startDate = shift.startDate as Date;
      const endDate = shift.endDate as Date;
      const [sh, sm] = (shift.dailyStartTime ?? '00:00').split(':').map(Number);
      const [eh, em] = (shift.dailyEndTime ?? '00:00').split(':').map(Number);

      const start = new Date(startDate);
      start.setHours(sh, sm, 0, 0);

      const end = new Date(endDate);
      if (shift.dailyEndTime && shift.dailyStartTime && shift.dailyEndTime <= shift.dailyStartTime) {
        end.setDate(end.getDate() + 1);
      }
      end.setHours(eh, em, 0, 0);

      return { start, end };
    }

    return {
      start: intervals[0].start,
      end: intervals.reduce((max, it) => (it.end > max ? it.end : max), intervals[0].end),
    };
  }

  async create(
    data: {
      locationId: string;
      startDate: string;
      endDate: string;
      daysOfWeek: number[];
      dailyStartTime: string;
      dailyEndTime: string;
      requiredSkillId: string;
      headcountNeeded: number;
    },
    user: User,
  ): Promise<Shift> {
    const can = await this.permissions.canManageLocation(user, data.locationId);
    if (!can) throw new ForbiddenException('You cannot create shifts for this location');

    if (data.startDate > data.endDate) {
      throw new BadRequestException('startDate must be on or before endDate');
    }
    if (data.dailyStartTime === data.dailyEndTime) {
      throw new BadRequestException('dailyStartTime and dailyEndTime must differ');
    }
    if (!Array.isArray(data.daysOfWeek) || data.daysOfWeek.length === 0) {
      throw new BadRequestException('daysOfWeek must be a non-empty list');
    }

    const shift = await this.shiftRepository.create({
      locationId: data.locationId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      daysOfWeek: data.daysOfWeek,
      dailyStartTime: data.dailyStartTime,
      dailyEndTime: data.dailyEndTime,
      requiredSkillId: data.requiredSkillId,
      headcountNeeded: data.headcountNeeded,
      published: false,
    });
    await this.auditService.log(
      user.id,
      AuditAction.Create,
      AuditEntityType.Shift,
      shift.id,
      null,
      shift.toJSON() as unknown as Record<string, unknown>,
    );
    this.eventsGateway.emitToLocation(shift.locationId, WS_EVENTS.SCHEDULE_UPDATED, {
      shiftId: shift.id,
      action: 'created',
    });
    await this.notifyManagersForLocation(
      shift.locationId,
      'schedule_created',
      'New shift created',
      `A new shift was created for location ${shift.locationId}.`,
      { shiftId: shift.id, locationId: shift.locationId },
    );
    return shift;
  }

  async update(
    id: string,
    data: {
      startDate?: string;
      endDate?: string;
      daysOfWeek?: number[];
      dailyStartTime?: string;
      dailyEndTime?: string;
      requiredSkillId?: string;
      headcountNeeded?: number;
    },
    user: User,
  ): Promise<Shift> {
    const shift = await this.shiftRepository.findByIdOrFail(id);
    const can = await this.permissions.canManageLocation(user, shift.locationId);
    if (!can) throw new ForbiddenException('You cannot edit this shift');

    const boundsBefore = this.getTemplateBounds(shift);
    if (shift.published && this.isPastCutoff(boundsBefore.start)) {
      throw new BadRequestException('Cannot edit shift after cutoff (default 48h before start)');
    }

    const before = shift.toJSON() as unknown as Record<string, unknown>;

    if (data.startDate !== undefined) {
      shift.startDate = new Date(data.startDate);
    }
    if (data.endDate !== undefined) {
      shift.endDate = new Date(data.endDate);
    }
    if (data.dailyStartTime !== undefined) {
      shift.dailyStartTime = data.dailyStartTime;
    }
    if (data.dailyEndTime !== undefined) {
      shift.dailyEndTime = data.dailyEndTime;
    }
    if (data.daysOfWeek !== undefined) {
      if (!Array.isArray(data.daysOfWeek) || data.daysOfWeek.length === 0) {
        throw new BadRequestException('daysOfWeek must be a non-empty list');
      }
      shift.daysOfWeek = data.daysOfWeek;
    }
    if (data.requiredSkillId !== undefined) {
      shift.requiredSkillId = data.requiredSkillId;
    }
    if (data.headcountNeeded !== undefined) {
      if (data.headcountNeeded < 1) {
        throw new BadRequestException('headcountNeeded must be at least 1');
      }
      const currentCount = (await this.assignmentRepository.findAllByShiftId(id, ['id'])).length;
      if (currentCount > data.headcountNeeded) {
        throw new BadRequestException('Cannot reduce headcount below existing assignments.');
      }
      shift.headcountNeeded = data.headcountNeeded;
    }

    const sDate = this.toDateOnly(shift.startDate as Date | string);
    const eDate = this.toDateOnly(shift.endDate as Date | string);
    if (sDate > eDate) {
      throw new BadRequestException('startDate must be on or before endDate');
    }
    if (shift.dailyStartTime === shift.dailyEndTime) {
      throw new BadRequestException('dailyStartTime and dailyEndTime must differ');
    }

    await shift.save();
    await this.auditService.log(
      user.id,
      AuditAction.Update,
      AuditEntityType.Shift,
      shift.id,
      before,
      shift.toJSON() as unknown as Record<string, unknown>,
    );
    await this.requestsService.cancelPendingByShiftId(shift.id);
    this.eventsGateway.emitToLocation(shift.locationId, WS_EVENTS.SCHEDULE_UPDATED, {
      shiftId: shift.id,
      action: 'updated',
    });
    await this.notifyManagersForLocation(
      shift.locationId,
      'schedule_updated',
      'Shift updated',
      `A shift was updated for location ${shift.locationId}.`,
      { shiftId: shift.id, locationId: shift.locationId },
    );
    if (shift.published) {
      await this.notifyAssignedStaffForShift(
        shift.id,
        shift.locationId,
        'shift_updated',
        'Your shift was updated',
        'A published shift you are assigned to was changed.',
        { shiftId: shift.id, locationId: shift.locationId },
      );
    }
    return shift;
  }

  async addAssignment(
    shiftId: string,
    data: { userId: string; skillId: string; overtimeOverrideReason?: string | null },
    user: User,
  ): Promise<{ assignment: ShiftAssignment; constraintError?: ConstraintResult }> {
    const shift = await this.shiftRepository.findByIdOrFail(shiftId);
    const can = await this.permissions.canManageLocation(user, shift.locationId);
    if (!can) throw new ForbiddenException('You cannot assign to this shift');
    const { start, end } = this.getTemplateBounds(shift);
    if (shift.published && this.isPastCutoff(start)) {
      throw new BadRequestException('Cannot change assignment after cutoff');
    }
    const txnResult = await this.sequelize.transaction(async (transaction) => {
      // Serialize concurrent assignment attempts for the same staff member.
      await User.findByPk(data.userId, { transaction, lock: Transaction.LOCK.UPDATE });
      // Serialize headcount cap updates across different staff assignments.
      await Shift.findByPk(shiftId, { transaction, lock: Transaction.LOCK.UPDATE });

      // Enforce shift-level required skill for assignments by default.
      if (data.skillId !== shift.requiredSkillId) {
        const message = 'Shift requires a different skill for assignments.';
        const alternatives = await this.constraints.getAlternatives(
          shift.locationId,
          shift.requiredSkillId,
          shift,
          data.userId,
        );
        this.eventsGateway.emitToUser(data.userId, WS_EVENTS.ASSIGNMENT_CONFLICT, {
          shiftId,
          reason: message,
        });
        return {
          constraintError: {
            valid: false,
            message,
            alternatives,
          },
        };
      }

      const dupAssignee = await this.assignmentRepository.countByShiftIdAndUserId(
        shiftId,
        data.userId,
        { transaction },
      );
      if (dupAssignee > 0) {
        const message = 'Staff is already assigned to this shift.';
        this.eventsGateway.emitToUser(data.userId, WS_EVENTS.ASSIGNMENT_CONFLICT, {
          shiftId,
          reason: message,
        });
        const alternatives = await this.constraints.getAlternatives(
          shift.locationId,
          shift.requiredSkillId,
          shift,
          data.userId,
        );
        return {
          constraintError: {
            valid: false,
            message,
            alternatives,
          },
        };
      }

      // Enforce shift-level headcount cap.
      const currentCount = await this.assignmentRepository.countByShiftId(shiftId, { transaction });
      if (currentCount >= shift.headcountNeeded) {
        const message = 'Shift headcount is already filled.';
        this.eventsGateway.emitToUser(data.userId, WS_EVENTS.ASSIGNMENT_CONFLICT, {
          shiftId,
          reason: message,
        });
        const alternatives = await this.constraints.getAlternatives(
          shift.locationId,
          shift.requiredSkillId,
          shift,
          data.userId,
        );
        return {
          constraintError: {
            valid: false,
            message,
            alternatives,
          },
        };
      }

      const result = await this.constraints.validateAssignment(
        data.userId,
        shift.locationId,
        data.skillId,
        shift,
      );
      if (!result.valid) {
        this.eventsGateway.emitToUser(data.userId, WS_EVENTS.ASSIGNMENT_CONFLICT, {
          shiftId,
          reason: result.message,
        });
        const alternatives = await this.constraints.getAlternatives(
          shift.locationId,
          data.skillId,
          shift,
          data.userId,
        );
        return { constraintError: { ...result, alternatives } };
      }
      const whatIf = await this.overtimeService.whatIfTemplate(
        data.userId,
        shift.id,
        data.overtimeOverrideReason ?? undefined,
      );
      if (!whatIf.canAssign) {
        const onlyOverride =
          whatIf.consecutiveRequireOverride && !whatIf.weeklyBlock && !whatIf.dailyBlock;
        if (!onlyOverride || !data.overtimeOverrideReason) {
          throw new BadRequestException(whatIf.message ?? 'Assignment would violate overtime rules.');
        }
      }
      const created = await this.assignmentRepository.create(
        {
          shiftId,
          userId: data.userId,
          skillId: data.skillId,
          version: 1,
          overtimeOverrideReason: data.overtimeOverrideReason ?? null,
        },
        { transaction },
      );
      return { assignment: created };
    });
    if ('constraintError' in txnResult && txnResult.constraintError) {
      return { assignment: null as any, constraintError: txnResult.constraintError };
    }
    const assignment = txnResult.assignment;
    await this.auditService.log(
      user.id,
      AuditAction.Create,
      AuditEntityType.ShiftAssignment,
      assignment.id,
      null,
      assignment.toJSON() as unknown as Record<string, unknown>,
    );
    this.eventsGateway.emitToLocation(shift.locationId, WS_EVENTS.SCHEDULE_UPDATED, {
      shiftId: shift.id,
      action: 'assignment_added',
      userId: data.userId,
    });
    await this.notifications.createAndPush(
      data.userId,
      'shift_assigned',
      'New shift assignment',
      'You were assigned to a shift.',
      { shiftId: shift.id, locationId: shift.locationId, assignmentId: assignment.id },
    );
    return { assignment };
  }

  async removeAssignment(assignmentId: string, user: User): Promise<boolean> {
    const assignment = await this.assignmentRepository.findByIdOrFailWithShift(assignmentId);
    const shift = (assignment as { shift: Shift }).shift;
    if (!shift) throw new NotFoundException('Shift not found');
    const can = await this.permissions.canManageLocation(user, shift.locationId);
    if (!can) throw new ForbiddenException('You cannot remove this assignment');
    const { start } = this.getTemplateBounds(shift);
    if (shift.published && this.isPastCutoff(start)) {
      throw new BadRequestException('Cannot change assignment after cutoff');
    }
    const before = assignment.toJSON() as unknown as Record<string, unknown>;
    await this.assignmentRepository.delete(assignmentId);
    await this.auditService.log(
      user.id,
      AuditAction.Delete,
      AuditEntityType.ShiftAssignment,
      assignmentId,
      before,
      null,
    );
    this.eventsGateway.emitToLocation(shift.locationId, WS_EVENTS.SCHEDULE_UPDATED, {
      shiftId: shift.id,
      action: 'assignment_removed',
      assignmentId,
    });
    return true;
  }

  async publish(shiftId: string, user: User): Promise<Shift> {
    const shift = await this.shiftRepository.findByIdOrFail(shiftId);
    const can = await this.permissions.canManageLocation(user, shift.locationId);
    if (!can) throw new ForbiddenException('You cannot publish this shift');
    const beforePublish = shift.toJSON() as unknown as Record<string, unknown>;
    const updated = await this.shiftRepository.updatePublished(shiftId, true);
    await this.auditService.log(
      user.id,
      AuditAction.Update,
      AuditEntityType.Shift,
      shiftId,
      beforePublish,
      updated.toJSON() as unknown as Record<string, unknown>,
    );
    this.eventsGateway.emitToLocation(updated.locationId, WS_EVENTS.SCHEDULE_PUBLISHED, {
      shiftId: updated.id,
      locationId: updated.locationId,
      published: true,
    });
    await this.notifyManagersForLocation(
      updated.locationId,
      'schedule_published',
      'Schedule published',
      `Shift ${updated.id} has been published.`,
      { shiftId: updated.id, locationId: updated.locationId },
    );
    await this.notifyAssignedStaffForShift(
      updated.id,
      updated.locationId,
      'schedule_published_staff',
      'Schedule published',
      'A shift you are assigned to is now published.',
      { shiftId: updated.id, locationId: updated.locationId },
    );
    return updated;
  }

  async publishWeek(locationId: string, weekStart: Date, user: User): Promise<number> {
    const can = await this.permissions.canManageLocation(user, locationId);
    if (!can) throw new ForbiddenException('You cannot publish shifts for this location');
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const toPublish = await this.shiftRepository.findUnpublishedInWeekWindow(locationId, weekStart, weekEnd);
    const beforeById = new Map(
      toPublish.map((s) => [s.id, s.toJSON() as unknown as Record<string, unknown>]),
    );
    const count = await this.shiftRepository.updateWeekPublished(locationId, weekStart, weekEnd, true);
    await Promise.all(
      toPublish.map(async (s) => {
        const after = await this.shiftRepository.findById(s.id);
        if (!after) return;
        const before = beforeById.get(s.id);
        if (before) {
          await this.auditService.log(
            user.id,
            AuditAction.Update,
            AuditEntityType.Shift,
            s.id,
            before,
            after.toJSON() as unknown as Record<string, unknown>,
          );
        }
      }),
    );
    this.eventsGateway.emitToLocation(locationId, WS_EVENTS.SCHEDULE_PUBLISHED, {
      locationId,
      weekStart,
      publishedCount: count,
    });
    await this.notifyManagersForLocation(
      locationId,
      'schedule_week_published',
      'Weekly schedule published',
      `${count} shifts were published for the selected week.`,
      { locationId, weekStart, publishedCount: count },
    );
    await Promise.all(
      toPublish.map((s) =>
        this.notifyAssignedStaffForShift(
          s.id,
          locationId,
          'schedule_published_staff',
          'Schedule published',
          'A shift you are assigned to is now published.',
          { shiftId: s.id, locationId },
        ),
      ),
    );
    return count;
  }

  async unpublish(shiftId: string, user: User): Promise<Shift> {
    const shift = await this.shiftRepository.findByIdOrFail(shiftId);
    const can = await this.permissions.canManageLocation(user, shift.locationId);
    if (!can) throw new ForbiddenException('You cannot unpublish this shift');

    // Enforce the same cutoff policy as edits: only allow unpublish before cutoff.
    if (shift.published) {
      const boundsBefore = this.getTemplateBounds(shift);
      if (this.isPastCutoff(boundsBefore.start)) {
        throw new BadRequestException('Cannot unpublish shift after cutoff (default 48h before start)');
      }
    }

    const beforeUnpublish = shift.toJSON() as unknown as Record<string, unknown>;
    const updated = await this.shiftRepository.updatePublished(shiftId, false);
    await this.auditService.log(
      user.id,
      AuditAction.Update,
      AuditEntityType.Shift,
      shiftId,
      beforeUnpublish,
      updated.toJSON() as unknown as Record<string, unknown>,
    );

    // Cancels any pending swap/drop requests related to this schedule change.
    await this.requestsService.cancelPendingByShiftId(updated.id);

    this.eventsGateway.emitToLocation(updated.locationId, WS_EVENTS.SCHEDULE_UPDATED, {
      shiftId: updated.id,
      locationId: updated.locationId,
      action: 'unpublished',
      published: false,
    });

    await this.notifyManagersForLocation(
      updated.locationId,
      'schedule_unpublished',
      'Schedule unpublished',
      `Shift ${updated.id} has been unpublished.`,
      { shiftId: updated.id, locationId: updated.locationId },
    );

    // Notify staff who currently have assignments on this shift.
    const assignments = await this.assignmentRepository.findAllByShiftId(updated.id, ['userId']);
    const uniqueUserIds = [...new Set(assignments.map((a) => (a as { userId: string }).userId))];
    await Promise.all(
      uniqueUserIds.map((uid) =>
        this.notifications.createAndPush(
          uid,
          'shift_unpublished',
          'Shift unpublished',
          'A published shift was unpublished and is no longer visible to staff.',
          { shiftId: updated.id, locationId: updated.locationId },
        ),
      ),
    );

    return updated;
  }

  async delete(id: string, user: User): Promise<void> {
    const shift = await this.shiftRepository.findByIdOrFail(id);
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only Admin can delete shifts');
    }
    const assignments = await this.assignmentRepository.findAllByShiftId(id);
    for (const a of assignments) {
      await this.assignmentRepository.delete(a.id);
      await this.auditService.log(
        user.id,
        AuditAction.Delete,
        AuditEntityType.ShiftAssignment,
        a.id,
        a.toJSON() as unknown as Record<string, unknown>,
        null,
      );
    }
    const before = shift.toJSON() as unknown as Record<string, unknown>;
    await shift.destroy();
    await this.auditService.log(
      user.id,
      AuditAction.Delete,
      AuditEntityType.Shift,
      id,
      before,
      null,
    );
  }

  async findForManager(user: User): Promise<Shift[]> {
    const locationIds = await this.permissions.getManagerLocationIds(user);
    if (locationIds && locationIds.length === 0) return [];
    if (locationIds === null) return this.shiftRepository.findAll();
    return this.shiftRepository.findAllByLocationIds(locationIds);
  }

  async findOne(id: string, user: User): Promise<Shift | null> {
    const shift = await this.shiftRepository.findByIdWithDetails(id);
    if (!shift) return null;
    if (user.role === UserRole.Admin) return shift;
    if (user.role === UserRole.Manager) {
      const can = await this.permissions.canManageLocation(user, shift.locationId);
      return can ? shift : null;
    }
    return null;
  }

  /** Assignments for the current user with shift (for staff "My shifts"). */
  async findMyAssignments(user: User): Promise<ShiftAssignment[]> {
    return this.assignmentRepository.findAllByUserIdWithShift(user.id);
  }

  /** On-duty: shifts where the template covers "now" (optionally filter by userId or locationId) */
  async findOnDuty(
    user: User,
    options: { userId?: string; locationId?: string },
  ): Promise<Shift[]> {
    const now = new Date();
    // First, fetch candidate shifts by date range overlap (including possible overnight from previous day)
    let shifts = await this.shiftRepository.findInWindow({
      startDateLte: now,
      endDateGte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      published: true,
      locationId: options.locationId,
    });
    // Then, filter in-memory by derived interval covering "now"
    shifts = shifts.filter((s) => {
      const intervals = expandShiftToIntervals(
        s as any,
        {
          start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          end: addDays(now, 1),
        },
        getShiftTimeZone(s as any),
      );
      return intervals.some((it) => it.start <= now && now < it.end);
    });
    if (options.userId) {
      shifts = shifts.filter((s) =>
        (s as Shift & { assignments?: { userId: string }[] }).assignments?.some(
          (a) => a.userId === options.userId,
        ),
      );
    }
    const scope = await this.permissions.getLocationScopeForRead(user);
    if (scope !== null) {
      if (scope.length === 0) return [];
      shifts = shifts.filter((s) => scope.includes(s.locationId));
    }
    return shifts;
  }
}
