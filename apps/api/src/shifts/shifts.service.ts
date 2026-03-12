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
  ) {}

  private getCutoffHours(): number {
    return this.config.get<number>('CUTOFF_HOURS', DEFAULT_CUTOFF_HOURS);
  }

  private isPastCutoff(shiftStartAt: Date): boolean {
    const cutoffMs = this.getCutoffHours() * 60 * 60 * 1000;
    return Date.now() >= (shiftStartAt.getTime() - cutoffMs);
  }

  async create(
    data: { locationId: string; startAt: Date; endAt: Date },
    user: User,
  ): Promise<Shift> {
    const can = await this.permissions.canManageLocation(user, data.locationId);
    if (!can) throw new ForbiddenException('You cannot create shifts for this location');
    if (data.startAt >= data.endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }
    const shift = await this.shiftRepository.create({
      locationId: data.locationId,
      startAt: data.startAt,
      endAt: data.endAt,
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
    data: { startAt?: Date; endAt?: Date },
    user: User,
  ): Promise<Shift> {
    const shift = await this.shiftRepository.findByIdOrFail(id);
    const can = await this.permissions.canManageLocation(user, shift.locationId);
    if (!can) throw new ForbiddenException('You cannot edit this shift');
    if (shift.published && this.isPastCutoff(shift.startAt)) {
      throw new BadRequestException('Cannot edit shift after cutoff (default 48h before start)');
    }
    const before = shift.toJSON() as unknown as Record<string, unknown>;
    if (data.startAt !== undefined) shift.startAt = data.startAt;
    if (data.endAt !== undefined) shift.endAt = data.endAt;
    if (data.startAt && data.endAt && data.startAt >= data.endAt) {
      throw new BadRequestException('startAt must be before endAt');
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
    if (shift.published && this.isPastCutoff(shift.startAt)) {
      throw new BadRequestException('Cannot change assignment after cutoff');
    }
    const result = await this.constraints.validateAssignment(
      data.userId,
      shift.locationId,
      data.skillId,
      shift.startAt,
      shift.endAt,
    );
    if (!result.valid) {
      const alternatives = await this.constraints.getAlternatives(
        shift.locationId,
        data.skillId,
        shift.startAt,
        shift.endAt,
        data.userId,
      );
      return {
        assignment: null as any,
        constraintError: { ...result, alternatives },
      };
    }
    const whatIf = await this.overtimeService.whatIf(
      data.userId,
      shift.startAt,
      shift.endAt,
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
    if (shift.published && this.isPastCutoff(shift.startAt)) {
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

  async unpublish(shiftId: string, user: User): Promise<Shift> {
    const shift = await this.shiftRepository.findByIdOrFail(shiftId);
    const can = await this.permissions.canManageLocation(user, shift.locationId);
    if (!can) throw new ForbiddenException('You cannot unpublish this shift');
    if (this.isPastCutoff(shift.startAt)) {
      throw new BadRequestException('Cannot unpublish shift after cutoff');
    }
    return this.shiftRepository.updatePublished(shiftId, false);
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

  /** On-duty: shifts where startAt <= now < endAt (optionally filter by userId or locationId) */
  async findOnDuty(
    user: User,
    options: { userId?: string; locationId?: string },
  ): Promise<Shift[]> {
    const now = new Date();
    let shifts = await this.shiftRepository.findInWindow({
      startAt: { lte: now },
      endAt: { gt: now },
      published: true,
      locationId: options.locationId,
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
