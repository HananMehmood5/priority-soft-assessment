import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@shiftsync/shared';
import { AuditService, AuditEntry } from './audit.service';
import { AuditEntryEntity } from './entities/audit-entry.entity';

@Resolver(() => AuditEntryEntity)
@UseGuards(JwtAuthGuard)
export class AuditResolver {
  constructor(private readonly auditService: AuditService) {}

  @Query(() => [AuditEntryEntity])
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async shiftHistory(
    @Args('shiftId', { type: () => String }) shiftId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<AuditEntryEntity[]> {
    const entries = await this.auditService.getShiftHistory(shiftId, user);
    return entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      before: e.before ? JSON.stringify(e.before) : null,
      after: e.after ? JSON.stringify(e.after) : null,
      createdAt: e.createdAt,
    }));
  }

  @Query(() => [AuditEntryEntity])
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async auditExport(
    @Args('start', { type: () => Date }) start: Date,
    @Args('end', { type: () => Date }) end: Date,
    @Args('locationId', { type: () => String, nullable: true }) locationId: string | null,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<AuditEntryEntity[]> {
    const entries = await this.auditService.export(new Date(start), new Date(end), locationId, user);
    return entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      before: e.before ? JSON.stringify(e.before) : null,
      after: e.after ? JSON.stringify(e.after) : null,
      createdAt: e.createdAt,
    }));
  }
}
