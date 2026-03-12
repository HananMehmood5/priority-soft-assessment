import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { ConstraintsModule } from '../constraints/constraints.module';
import { RequestsModule } from '../requests/requests.module';
import { OvertimeModule } from '../overtime/overtime.module';
import { AuditModule } from '../audit/audit.module';
import { ShiftsResolver, ShiftAssignmentResolver } from './shifts.resolver';
import { ShiftsService } from './shifts.service';

@Module({
  imports: [
    DatabaseModule,
    PermissionsModule,
    AuthModule,
    ConstraintsModule,
    RequestsModule,
    OvertimeModule,
    AuditModule,
  ],
  providers: [ShiftsResolver, ShiftAssignmentResolver, ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
