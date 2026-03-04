import { Injectable } from '@nestjs/common';
import { Notification } from '../database/models';
import { NotificationRepository } from '../database/repositories/notification.repository';
import { EventsGateway, WS_EVENTS } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string | null,
    body: string | null,
    payload: Record<string, unknown> | null,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.create({
      userId,
      type,
      title,
      body,
      payload,
      read: false,
    });
    this.eventsGateway.emitToUser(userId, WS_EVENTS.NOTIFICATION, notification.toJSON());
    return notification;
  }

  async createAndPush(
    userId: string,
    type: string,
    title: string | null,
    body: string | null,
    payload: Record<string, unknown> | null,
  ): Promise<Notification> {
    return this.create(userId, type, title, body, payload);
  }

  async list(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number },
  ): Promise<Notification[]> {
    return this.notificationRepository.list(userId, options);
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    return this.notificationRepository.markRead(id, userId);
  }

  async markAllRead(userId: string): Promise<number> {
    return this.notificationRepository.markAllRead(userId);
  }

  async getPreferences(userId: string) {
    return this.notificationRepository.getPreferences(userId);
  }

  async setPreference(
    userId: string,
    channel: string,
    enabled: boolean,
  ) {
    return this.notificationRepository.setPreference(userId, channel, enabled);
  }
}
