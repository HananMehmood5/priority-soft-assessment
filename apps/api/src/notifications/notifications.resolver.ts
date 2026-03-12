import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationPreferenceEntity } from './entities/notification-preference.entity';
import { Notification, NotificationPreference } from '../database/models';

@Resolver(() => NotificationEntity)
@UseGuards(JwtAuthGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [NotificationEntity])
  async notifications(
    @Args('unreadOnly', { type: () => Boolean, nullable: true }) unreadOnly: boolean | undefined,
    @Args('limit', { type: () => Int, nullable: true }) limit: number | undefined,
    @Args('offset', { type: () => Int, nullable: true }) offset: number | undefined,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Notification[]> {
    return this.notificationsService.list(user.id, { unreadOnly, limit, offset });
  }

  @Mutation(() => NotificationEntity)
  async markNotificationRead(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Notification> {
    return this.notificationsService.markRead(id, user.id);
  }

  @Mutation(() => Number)
  async markAllNotificationsRead(
    @CurrentUser() user: import('../database/models').User,
  ): Promise<number> {
    return this.notificationsService.markAllRead(user.id);
  }

  @Query(() => [NotificationPreferenceEntity])
  async notificationPreferences(
    @CurrentUser() user: import('../database/models').User,
  ): Promise<NotificationPreference[]> {
    return this.notificationsService.getPreferences(user.id);
  }

  @Mutation(() => NotificationPreferenceEntity)
  async setNotificationPreference(
    @Args('channel', { type: () => String }) channel: string,
    @Args('enabled', { type: () => Boolean }) enabled: boolean,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<NotificationPreference> {
    return this.notificationsService.setPreference(user.id, channel, enabled);
  }
}
