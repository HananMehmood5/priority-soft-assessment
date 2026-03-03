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
import { StaffSkill } from './staff-skill.model';

@Table({
  tableName: 'skills',
  underscored: true,
})
export class Skill extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsToMany(() => User, () => StaffSkill)
  staff: User[];
}
