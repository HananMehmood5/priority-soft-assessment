import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { AuditLog, AuditAction, AuditEntityType } from '../models/audit-log.model';

export type AuditLogWhere = WhereOptions<AuditLog>;

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectModel(AuditLog)
    private readonly auditModel: typeof AuditLog,
  ) { }

  async create(data: {
    userId: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  }): Promise<AuditLog> {
    return this.auditModel.create(data);
  }

  async findAllForShiftHistory(assignmentIds: string[], shiftId: string): Promise<AuditLog[]> {
    return this.auditModel.findAll({
      where: {
        [Op.or]: [
          { entityType: AuditEntityType.Shift, entityId: shiftId },
          { entityType: AuditEntityType.ShiftAssignment, entityId: { [Op.in]: assignmentIds } },
        ],
      },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
  }

  async findAllByWhere(
    where: AuditLogWhere,
    options: { limit?: number } = {},
  ): Promise<AuditLog[]> {
    return this.auditModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit ?? 5000,
    });
  }
}
