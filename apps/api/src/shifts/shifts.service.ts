import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, AuditEntityType, UserRole } from '@shiftsync/shared';
import { Shift, ShiftAssignment, User } from '../database/models';
import { ShiftRepository } from '../database/repositories/shift.repository';
import { ShiftAssignmentRepository } from '../database/repositories/shift-assignment.repository';
import { PermissionsService } from '../permissions/permissions.service';
import { ConstraintsService, ConstraintResult } from '../constraints/constraints.service';
import { RequestsService } from '../requests/requests.service';
import { OvertimeService } from '../overtime/overtime.service';
import { AuditService } from '../audit/audit.service';
import { expandShiftToIntervals } from '../common/shift-time.utils';
import { addDays } from '../common/utils/date.utils';

const DEFAULT_CUTOFF_HOURS = 48;

@Injectable()
export class ShiftsService {
  constructor(
    private readonly shiftRepository: ShiftRepository,
    private readonly assignmentRepository: ShiftAssignmentRepository,
    private readonly permissions: PermissionsService,
    private readonly constraints: ConstraintsService,
    private readonly config: ConfigService,
    private readonly requestsService: RequestsService,
    private readonly overtimeService: OvertimeService,
    private readonly auditService: AuditService,
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

  /** Derive a single concrete interval covering the whole shift template. */
  private getTemplateBounds(shift: Shift): { start: Date; end: Date } {
    const intervals = expandShiftToIntervals(shift as any);
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
    const result = await this.constraints.validateAssignment(
      data.userId,
      shift.locationId,
      data.skillId,
      shift,
    );
    if (!result.valid) {
      const alternatives = await this.constraints.getAlternatives(
        shift.locationId,
        data.skillId,
        shift,
        data.userId,
      );
      return {
        assignment: null as any,
        constraintError: { ...result, alternatives },
      };
    }
    const whatIf = await this.overtimeService.whatIfTemplate(
      data.userId,
      shift.id,
      data.overtimeOverrideReason ?? undefined,
    );
    if (!whatIf.canAssign) {
      const onlyOverride = whatIf.consecutiveRequireOverride && !whatIf.weeklyBlock && !whatIf.dailyBlock;
      if (onlyOverride && data.overtimeOverrideReason) {
        // Allow with documented reason
      } else {
        throw new BadRequestException(whatIf.message ?? 'Assignment would violate overtime rules.');
      }
    }
    const assignment = await this.assignmentRepository.create({
      shiftId,
      userId: data.userId,
      skillId: data.skillId,
      version: 1,
      overtimeOverrideReason: data.overtimeOverrideReason ?? null,
    });
    await this.auditService.log(
      user.id,
      AuditAction.Create,
      AuditEntityType.ShiftAssignment,
      assignment.id,
      null,
      assignment.toJSON() as unknown as Record<string, unknown>,
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
    return true;
  }

  async publish(shiftId: string, user: User): Promise<Shift> {
    const shift = await this.shiftRepository.findByIdOrFail(shiftId);
    const can = await this.permissions.canManageLocation(user, shift.locationId);
    if (!can) throw new ForbiddenException('You cannot publish this shift');
    return this.shiftRepository.updatePublished(shiftId, true);
  }

  async publishWeek(locationId: string, weekStart: Date, user: User): Promise<number> {
    const can = await this.permissions.canManageLocation(user, locationId);
    if (!can) throw new ForbiddenException('You cannot publish shifts for this location');
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return this.shiftRepository.updateWeekPublished(locationId, weekStart, weekEnd, true);
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
      const intervals = expandShiftToIntervals(s as any, {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        end: addDays(now, 1),
      });
      return intervals.some((it) => it.start <= now && now < it.end);
    });
    if (options.userId) {
      shifts = shifts.filter((s) =>
        (s as Shift & { assignments?: { userId: string }[] }).assignments?.some(
          (a) => a.userId === options.userId,
        ),
      );
    }
    const locationIds = await this.permissions.getManagerLocationIds(user);
    if (locationIds !== null && locationIds.length > 0) {
      shifts = shifts.filter((s) => locationIds.includes(s.locationId));
    }
    return shifts;
  }
}
