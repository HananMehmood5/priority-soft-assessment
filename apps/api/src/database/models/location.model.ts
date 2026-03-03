import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ManagerLocation } from './manager-location.model';
import { StaffLocation } from './staff-location.model';

@Table({
  tableName: 'locations',
  underscored: true,
})
export class Location extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  /** IANA timezone (e.g. America/Los_Angeles) */
  @Column({ type: DataType.STRING(64), allowNull: false })
  timezone: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => User, () => ManagerLocation)
  managers: User[];

  @BelongsToMany(() => User, () => StaffLocation)
  certifiedStaff: User[];
}
