import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { ConstraintsModule } from '../constraints/constraints.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';
import { RequestsResolver } from './requests.resolver';
import { RequestsService } from './requests.service';

@Module({
  imports: [DatabaseModule, PermissionsModule, AuthModule, ConstraintsModule, NotificationsModule, EventsModule],
  providers: [RequestsResolver, RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
