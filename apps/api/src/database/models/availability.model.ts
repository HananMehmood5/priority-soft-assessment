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

/** Day of week 0 = Sunday, 6 = Saturday */
@Table({
  tableName: 'availabilities',
  underscored: true,
})
export class Availability extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  /** If null, availability applies to all certified locations */
  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: true })
  locationId: string | null;

  @Column({ type: DataType.SMALLINT, allowNull: false }) // 0-6
  dayOfWeek: number;

  /** Time of day, stored as "HH:mm" in location local time */
  @Column({ type: DataType.STRING(5), allowNull: false })
  startTime: string;

  @Column({ type: DataType.STRING(5), allowNull: false })
  endTime: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Location)
  location: Location | null;
}
