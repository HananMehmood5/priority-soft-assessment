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
import { Skill } from './skill.model';

@Table({
  tableName: 'staff_skills',
  underscored: true,
  indexes: [{ unique: true, fields: ['user_id', 'skill_id'] }],
})
export class StaffSkill extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  @ForeignKey(() => Skill)
  @Column({ type: DataType.UUID, allowNull: false })
  skillId: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Skill)
  skill: Skill;
}
