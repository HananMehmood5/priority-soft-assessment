import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { AuditService } from './audit.service';
import { AuditResolver } from './audit.resolver';

@Module({
  imports: [DatabaseModule, PermissionsModule, AuthModule],
  providers: [AuditService, AuditResolver],
  exports: [AuditService],
})
export class AuditModule {}
