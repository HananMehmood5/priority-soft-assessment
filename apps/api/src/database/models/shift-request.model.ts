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
import type { ShiftRequestBaseAttributes } from '@shiftsync/shared';
import type { ShiftRequestAttributesDb } from '@shiftsync/shared';
import { RequestStatus, RequestType } from '@shiftsync/shared';
import { ShiftAssignment } from './shift-assignment.model';
import { User } from './user.model';

@Table({
  tableName: 'shift_requests',
  underscored: true,
})
export class ShiftRequest extends Model<
  ShiftRequestAttributesDb,
  ShiftRequestBaseAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.ENUM(...Object.values(RequestType)),
    allowNull: false,
  })
  type: RequestType;

  /** The assignment being given up (swap or drop) */
  @ForeignKey(() => ShiftAssignment)
  @Column({ type: DataType.UUID, allowNull: false })
  assignmentId: string;

  /** For swap: the counterpart's assignment (set when they accept) */
  @ForeignKey(() => ShiftAssignment)
  @Column({ type: DataType.UUID, allowNull: true })
  counterpartAssignmentId: string | null;

  /** For drop: user who claimed (set when they accept) */
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  claimerUserId: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(RequestStatus)),
    allowNull: false,
    defaultValue: RequestStatus.Pending,
  })
  status: RequestStatus;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => ShiftAssignment, 'assignmentId')
  assignment: ShiftAssignment;

  @BelongsTo(() => ShiftAssignment, 'counterpartAssignmentId')
  counterpartAssignment: ShiftAssignment | null;

  @BelongsTo(() => User, 'claimerUserId')
  claimer: User | null;
}
