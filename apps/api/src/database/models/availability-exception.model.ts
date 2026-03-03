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
import { Location } from './location.model';

@Table({
  tableName: 'availability_exceptions',
  underscored: true,
})
export class AvailabilityException extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: true })
  locationId: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  date: string;

  @Column({ type: DataType.STRING(5), allowNull: true }) // "HH:mm" or null if allDay
  startTime: string | null;

  @Column({ type: DataType.STRING(5), allowNull: true })
  endTime: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  allDay: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Location)
  location: Location | null;
}
