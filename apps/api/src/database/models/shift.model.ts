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
import { Location } from './location.model';
import { ShiftAssignment } from './shift-assignment.model';

@Table({
  tableName: 'shifts',
  underscored: true,
})
export class Shift extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Location)
  @Column({ type: DataType.UUID, allowNull: false })
  locationId: string;

  /** UTC */
  @Column({ type: DataType.DATE, allowNull: false })
  startAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  endAt: Date;

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
