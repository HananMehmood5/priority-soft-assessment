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
import { User } from './user.model';

@Table({
  tableName: 'desired_hours',
  underscored: true,
})
export class DesiredHours extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false })
  weeklyHours: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  effectiveFrom: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;
}
