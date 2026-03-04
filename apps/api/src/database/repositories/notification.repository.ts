import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { NotificationBaseAttributes } from '@shiftsync/shared';
import { Notification } from '../models/notification.model';
import { NotificationPreference } from '../models/notification-preference.model';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
    @InjectModel(NotificationPreference)
    private readonly preferenceModel: typeof NotificationPreference,
  ) {}

  async create(data: NotificationBaseAttributes): Promise<Notification> {
    return this.notificationModel.create({
      ...data,
      read: data.read ?? false,
    });
  }

  async list(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const where: { userId: string; read?: boolean } = { userId };
    if (options.unreadOnly) where.read = false;
    return this.notificationModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await notification.update({ read: true });
    return notification;
  }

  async markAllRead(userId: string): Promise<number> {
    const [count] = await this.notificationModel.update(
      { read: true },
      { where: { userId, read: false } },
    );
    return count;
  }

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    return this.preferenceModel.findAll({ where: { userId } });
  }

  async setPreference(
    userId: string,
    channel: string,
    enabled: boolean,
  ): Promise<NotificationPreference> {
    const [pref] = await this.preferenceModel.findOrCreate({
      where: { userId, channel },
      defaults: { userId, channel, enabled },
    });
    await pref.update({ enabled });
    return pref;
  }
}
