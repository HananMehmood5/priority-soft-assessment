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

@Table({
  tableName: 'notification_preferences',
  underscored: true,
  indexes: [{ unique: true, fields: ['user_id', 'channel'] }],
})
export class NotificationPreference extends Model {
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
  channel: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  enabled: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;
}
