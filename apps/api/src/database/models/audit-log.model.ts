import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import type { AuditLogBaseAttributes } from '@shiftsync/shared';
import type { AuditLogAttributesDb } from '@shiftsync/shared';
import { AuditAction, AuditEntityType } from '@shiftsync/shared';
import { User } from './user.model';

@Table({
  tableName: 'audit_logs',
  underscored: true,
  indexes: [
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['created_at'] },
    { fields: ['user_id'] },
  ],
})
export class AuditLog extends Model<AuditLogAttributesDb, AuditLogBaseAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  @Column({
    type: DataType.ENUM(...Object.values(AuditAction)),
    allowNull: false,
  })
  action: AuditAction;

  @Column({
    type: DataType.ENUM(...Object.values(AuditEntityType)),
    allowNull: false,
  })
  entityType: AuditEntityType;

  @Column({ type: DataType.UUID, allowNull: false })
  entityId: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  before: Record<string, unknown> | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  after: Record<string, unknown> | null;

  @CreatedAt
  createdAt: Date;

  @BelongsTo(() => User)
  user: User;
}
