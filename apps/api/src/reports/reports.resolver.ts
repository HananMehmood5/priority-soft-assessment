import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@shiftsync/shared';
import { ReportsService, DistributionEntry, PremiumFairnessEntry, DesiredHoursEntry } from './reports.service';
import { DistributionEntryEntity } from './entities/distribution-entry.entity';
import { PremiumFairnessEntryEntity } from './entities/premium-fairness-entry.entity';
import { DesiredHoursEntryEntity } from './entities/desired-hours-entry.entity';

@Resolver()
@UseGuards(JwtAuthGuard)
@UseGuards(RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager)
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}

  @Query(() => [DistributionEntryEntity])
  async reportDistribution(
    @Args('start', { type: () => Date }) start: Date,
    @Args('end', { type: () => Date }) end: Date,
    @Args('locationId', { type: () => String, nullable: true }) locationId: string | null,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<DistributionEntry[]> {
    return this.reportsService.getDistributionReport(new Date(start), new Date(end), locationId, user);
  }

  @Query(() => [PremiumFairnessEntryEntity])
  async reportPremiumFairness(
    @Args('start', { type: () => Date }) start: Date,
    @Args('end', { type: () => Date }) end: Date,
    @Args('locationId', { type: () => String, nullable: true }) locationId: string | null,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<PremiumFairnessEntry[]> {
    return this.reportsService.getPremiumFairnessReport(new Date(start), new Date(end), locationId, user);
  }

  @Query(() => [DesiredHoursEntryEntity])
  async reportDesiredHours(
    @Args('start', { type: () => Date }) start: Date,
    @Args('end', { type: () => Date }) end: Date,
    @Args('locationId', { type: () => String, nullable: true }) locationId: string | null,
    @Args('role', { type: () => UserRole, nullable: true }) role: UserRole | null,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<DesiredHoursEntry[]> {
    return this.reportsService.getDesiredHoursReport(new Date(start), new Date(end), locationId, role, user);
  }
}
