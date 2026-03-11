import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { ConstraintsModule } from '../constraints/constraints.module';
import { RequestsResolver } from './requests.resolver';
import { RequestsService } from './requests.service';

@Module({
  imports: [DatabaseModule, PermissionsModule, AuthModule, ConstraintsModule],
  providers: [RequestsResolver, RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
