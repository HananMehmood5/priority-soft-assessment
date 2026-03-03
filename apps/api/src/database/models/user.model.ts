import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Availability } from './availability.model';
import { AvailabilityException } from './availability-exception.model';
import { DesiredHours } from './desired-hours.model';
import { Location } from './location.model';
import { Skill } from './skill.model';
import { ManagerLocation } from './manager-location.model';
import { StaffLocation } from './staff-location.model';
import { StaffSkill } from './staff-skill.model';

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Staff = 'Staff',
}

@Table({
  tableName: 'users',
  underscored: true,
})
export class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  passwordHash: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
  })
  role: UserRole;

  @Column({ type: DataType.STRING(255), allowNull: true })
  name: string | null;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Availability)
  availabilities: Availability[];

  @HasMany(() => AvailabilityException)
  availabilityExceptions: AvailabilityException[];

  @HasMany(() => DesiredHours)
  desiredHours: DesiredHours[];

  @BelongsToMany(() => Location, () => ManagerLocation)
  managedLocations: Location[];

  @BelongsToMany(() => Location, () => StaffLocation)
  certifiedLocations: Location[];

  @BelongsToMany(() => Skill, () => StaffSkill)
  skills: Skill[];
}
