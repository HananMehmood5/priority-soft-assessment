import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type { ShiftAttributesDb, ShiftBaseAttributesDb } from '@shiftsync/shared';
import { Location } from './location.model';
import { ShiftAssignment } from './shift-assignment.model';

@Table({
  tableName: 'shifts',
  underscored: true,
})
export class Shift extends Model<ShiftAttributesDb, ShiftBaseAttributesDb> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false })
  locationId: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  startDate?: Date | null;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  endDate?: Date | null;

  @Column({ type: DataType.STRING, allowNull: false })
  dailyStartTime?: string | null;

  @Column({ type: DataType.STRING, allowNull: false })
  dailyEndTime?: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  published: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Location)
  location: Location;

  @HasMany(() => ShiftAssignment)
  assignments: ShiftAssignment[];
}
