import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({
  tableName: 'notifications',
  underscored: true,
})
export class Notification extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  @Column({ type: DataType.STRING(64), allowNull: false })
  type: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  title: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  body: string | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  payload: Record<string, unknown> | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  read: boolean;

  @CreatedAt
  createdAt: Date;

  @BelongsTo(() => User)
  user: User;
}
