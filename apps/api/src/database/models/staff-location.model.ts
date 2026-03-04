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
import type { StaffLocationBaseAttributes } from '@shiftsync/shared';
import type { StaffLocationAttributesDb } from '../db-types';
import { User } from './user.model';
import { Location } from './location.model';

@Table({
  tableName: 'staff_locations',
  underscored: true,
  indexes: [{ unique: true, fields: ['user_id', 'location_id'] }],
})
export class StaffLocation extends Model<
  StaffLocationAttributesDb,
  StaffLocationBaseAttributes
> {
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
  @Column({ type: DataType.UUID, allowNull: false })
  locationId: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Location)
  location: Location;
}
