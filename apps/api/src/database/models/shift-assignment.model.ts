import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type { ShiftAssignmentBaseAttributes } from '@shiftsync/shared';
import type { ShiftAssignmentAttributesDb } from '../db-types';
import { Shift } from './shift.model';
import { User } from './user.model';
import { Skill } from './skill.model';

@Table({
  tableName: 'shift_assignments',
  underscored: true,
})
export class ShiftAssignment extends Model<
  ShiftAssignmentAttributesDb,
  ShiftAssignmentBaseAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Shift)
  @Column({ type: DataType.UUID, allowNull: false })
  shiftId: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  @ForeignKey(() => Skill)
  @Column({ type: DataType.UUID, allowNull: false })
  skillId: string;

  /** Optimistic locking */
  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  version: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  overtimeOverrideReason: string | null;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Shift)
  shift: Shift;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Skill)
  skill: Skill;
}
