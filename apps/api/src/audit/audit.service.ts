import { Injectable, ForbiddenException } from '@nestjs/common';
import { Op } from 'sequelize';
import { AuditAction, AuditEntityType, UserRole } from '@shiftsync/shared';
import { AuditLog, User } from '../database/models';
import { AuditLogRepository, AuditLogWhere } from '../database/repositories/audit-log.repository';
import { ShiftRepository } from '../database/repositories/shift.repository';
import { ShiftAssignmentRepository } from '../database/repositories/shift-assignment.repository';
import { PermissionsService } from '../permissions/permissions.service';

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditLogRepository,
    private readonly shiftRepository: ShiftRepository,
    private readonly assignmentRepository: ShiftAssignmentRepository,
    private readonly permissions: PermissionsService,
  ) { }

  async log(
    userId: string,
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ): Promise<AuditLog> {
    return this.auditRepository.create({
      userId,
      action,
      entityType,
      entityId,
      before,
      after,
    });
  }

  async getShiftHistory(
    shiftId: string,
    user: User,
  ): Promise<AuditEntry[]> {
    if (user.role !== UserRole.Admin && user.role !== UserRole.Manager) {
      throw new ForbiddenException('Only managers and admins can view shift history');
    }

    if (user.role === UserRole.Manager) {
      const shift = await this.shiftRepository.findById(shiftId);
      if (!shift) throw new ForbiddenException('Shift not found');

      const can = await this.permissions.canManageLocation(user, shift.locationId);
      if (!can) throw new ForbiddenException('Access denied to this shift history');
    }

    const assignmentIds = await this.assignmentRepository.getAssignmentIdsForShift(shiftId);
    const logs = await this.auditRepository.findAllForShiftHistory(assignmentIds, shiftId);
    return logs.map((l) => this.toEntry(l));
  }

  private toEntry(log: AuditLog): AuditEntry {
    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      before: log.before,
      after: log.after,
      createdAt: log.createdAt,
    };
  }

  async export(
    start: Date,
    end: Date,
    locationId: string | null,
    user: User,
  ): Promise<AuditEntry[]> {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only admins can export audit logs');
    }
    let where: AuditLogWhere = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
    };
    if (locationId) {
      const shifts = await this.shiftRepository.findAllByLocationIds([locationId]);
      const shiftIds = shifts.map((s) => s.id);
      const assignmentIds = await Promise.all(
        shiftIds.map((sid) => this.assignmentRepository.getAssignmentIdsForShift(sid)),
      ).then((arr) => arr.flat());
      where = {
        ...where,
        [Op.or]: [
          { entityType: AuditEntityType.Shift, entityId: { [Op.in]: shiftIds } },
          { entityType: AuditEntityType.ShiftAssignment, entityId: { [Op.in]: assignmentIds } },
        ],
      };
    }
    const logs = await this.auditRepository.findAllByWhere(where, { limit: 5000 });
    return logs.map((log) => this.toEntry(log));
  }
}
