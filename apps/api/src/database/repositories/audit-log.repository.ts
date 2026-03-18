import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { AuditLogBaseAttributes } from '@shiftsync/shared';
import { Op, WhereOptions } from 'sequelize';
import { AuditEntityType } from '@shiftsync/shared';
import { AuditLog } from '../models/audit-log.model';

export type AuditLogWhere = WhereOptions<AuditLog>;

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectModel(AuditLog)
    private readonly auditModel: typeof AuditLog,
  ) { }

  async create(data: AuditLogBaseAttributes): Promise<AuditLog> {
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
