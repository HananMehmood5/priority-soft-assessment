import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@shiftsync/shared';
import { OvertimeService, WhatIfResult, DashboardOvertimeEntry } from './overtime.service';
import { WhatIfResultEntity } from './entities/what-if-result.entity';
import { DashboardOvertimeEntryEntity } from './entities/dashboard-entry.entity';

@Resolver()
@UseGuards(JwtAuthGuard)
export class OvertimeResolver {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Query(() => WhatIfResultEntity)
  async overtimeWhatIf(
    @Args('userId') userId: string,
    @Args('assignmentStart') assignmentStart: Date,
    @Args('assignmentEnd') assignmentEnd: Date,
    @Args('overtimeOverrideReason', { nullable: true }) overtimeOverrideReason?: string | null,
  ): Promise<WhatIfResult> {
    return this.overtimeService.whatIf(
      userId,
      new Date(assignmentStart),
      new Date(assignmentEnd),
      overtimeOverrideReason,
    );
  }

  @Query(() => [DashboardOvertimeEntryEntity])
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async overtimeDashboard(
    @Args('start') start: Date,
    @Args('end') end: Date,
    @Args('locationId', { nullable: true }) locationId?: string | null,
  ): Promise<DashboardOvertimeEntry[]> {
    return this.overtimeService.getDashboardData(
      locationId ?? null,
      new Date(start),
      new Date(end),
    );
  }
}
