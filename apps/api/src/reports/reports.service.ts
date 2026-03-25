import { ForbiddenException, Injectable } from '@nestjs/common';
import { getDay, getHours, endOfWeek, startOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Op } from 'sequelize';
import { UserRole } from '@shiftsync/shared';
import { Shift, ShiftAssignment, User } from '../database/models';
import { ShiftRepository } from '../database/repositories/shift.repository';
import { ShiftAssignmentRepository } from '../database/repositories/shift-assignment.repository';
import { UserRepository } from '../database/repositories/user.repository';
import { LocationRepository } from '../database/repositories/location.repository';
import { expandShiftToIntervals, getShiftTimeZone } from '../common/shift-time.utils';

export interface DistributionEntry {
  userId: string;
  userName: string | null;
  totalHours: number;
}

export interface PremiumFairnessEntry {
  userId: string;
  userName: string | null;
  premiumShiftCount: number;
  totalShiftCount: number;
  totalHours: number;
  fairnessScore: number; // premium / total when total > 0
}

export type DesiredHoursStatusType = 'under' | 'over' | 'ok';

export interface DesiredHoursEntry {
  userId: string;
  userName: string | null;
  desiredWeeklyHours: number;
  actualHours: number;
  status: DesiredHoursStatusType;
  difference: number;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly shiftRepository: ShiftRepository,
    private readonly assignmentRepository: ShiftAssignmentRepository,
    private readonly userRepository: UserRepository,
    private readonly locationRepository: LocationRepository,
  ) {}

  private applyLocationScope(
    shiftWhere: Record<string, unknown>,
    visibleIds: string[] | null,
    locationId: string | null,
  ): void {
    if (!locationId) {
      if (visibleIds) {
        shiftWhere.locationId = { [Op.in]: visibleIds };
      }
      return;
    }

    if (visibleIds && !visibleIds.includes(locationId)) {
      throw new ForbiddenException('You can only view reports for your managed locations');
    }

    shiftWhere.locationId = locationId;
  }

  /** Premium = Friday or Saturday, and "evening" = start at or after 17:00 local (5pm) */
  private isPremiumShift(shift: Shift, locationTimezone: string): boolean {
    const first = expandShiftToIntervals(shift as any, undefined, locationTimezone)[0];
    if (!first) return false;
    const zoned = toZonedTime(first.start, locationTimezone);
    const weekday = getDay(zoned); // 0=Sun, 5=Fri, 6=Sat
    const hour = getHours(zoned);
    return (weekday === 5 || weekday === 6) && hour >= 17;
  }

  private async getVisibleLocationIds(user: User): Promise<string[] | null> {
    if (user.role === UserRole.Admin) return null;
    if (user.role !== UserRole.Manager) return [];
    return this.locationRepository.getManagerLocationIdsByUserId(user.id);
  }

  async getDistributionReport(
    start: Date,
    end: Date,
    locationId: string | null,
    user: User,
  ): Promise<DistributionEntry[]> {
    const shiftWhere: Record<string, unknown> = {
      startDate: { [Op.lte]: end },
      endDate: { [Op.gte]: start },
    };
    const visibleIds = await this.getVisibleLocationIds(user);
    if (visibleIds !== null && visibleIds.length === 0) return [];
    this.applyLocationScope(shiftWhere, visibleIds, locationId);
    const assignments = await this.assignmentRepository.findAllWithShiftWhereAndUser(shiftWhere);
    const byUser = new Map<string, { name: string | null; hours: number }>();
    for (const a of assignments) {
      const shift = (a as { shift: Shift }).shift;
      if (!shift) continue;
      const uid = a.userId;
      const u = (a as { user: User }).user;
      const intervals = expandShiftToIntervals(shift as any, { start, end }, getShiftTimeZone(shift as any));
      const hours = intervals.reduce((sum, it) => sum + (it.end.getTime() - it.start.getTime()) / 3600000, 0);
      if (!byUser.has(uid)) byUser.set(uid, { name: u?.name ?? null, hours: 0 });
      byUser.get(uid)!.hours += hours;
    }
    return [...byUser.entries()].map(([userId, data]) => ({
      userId,
      userName: data.name,
      totalHours: Math.round(data.hours * 100) / 100,
    }));
  }

  async getPremiumFairnessReport(
    start: Date,
    end: Date,
    locationId: string | null,
    user: User,
  ): Promise<PremiumFairnessEntry[]> {
    const visibleIds = await this.getVisibleLocationIds(user);
    if (visibleIds !== null && visibleIds.length === 0) return [];
    const shiftWhere: Record<string, unknown> = {
      startDate: { [Op.lte]: end },
      endDate: { [Op.gte]: start },
    };
    this.applyLocationScope(shiftWhere, visibleIds, locationId);
    const shifts = await this.shiftRepository.findAllWithAssignmentsAndUserAndLocation(shiftWhere);
    const byUser = new Map<string, { userName: string | null; premium: number; total: number; hours: number }>();
    for (const shift of shifts) {
      const loc = (shift as { location?: { timezone?: string } }).location;
      const tz = loc?.timezone ?? 'UTC';
      const isPremium = this.isPremiumShift(shift, tz);
      const intervals = expandShiftToIntervals(shift as any, { start, end }, getShiftTimeZone(shift as any));
      const hours = intervals.reduce((sum, it) => sum + (it.end.getTime() - it.start.getTime()) / 3600000, 0);
      const assignments = (shift as { assignments?: ShiftAssignment[] }).assignments;
      for (const a of assignments || []) {
        const uid = a.userId;
        const u = (a as { user?: User }).user;
        if (!byUser.has(uid)) byUser.set(uid, { userName: u?.name ?? null, premium: 0, total: 0, hours: 0 });
        const row = byUser.get(uid)!;
        row.total++;
        row.hours += hours;
        if (isPremium) row.premium++;
      }
    }
    return [...byUser.entries()].map(([userId, data]) => ({
      userId,
      userName: data.userName,
      premiumShiftCount: data.premium,
      totalShiftCount: data.total,
      totalHours: Math.round(data.hours * 100) / 100,
      fairnessScore: data.total > 0 ? Math.round((data.premium / data.total) * 1000) / 1000 : 0,
    }));
  }

  async getDesiredHoursReport(
    start: Date,
    end: Date,
    locationId: string | null,
    role: UserRole | null,
    user: User,
  ): Promise<DesiredHoursEntry[]> {
    const visibleIds = await this.getVisibleLocationIds(user);
    if (visibleIds !== null && visibleIds.length === 0) return [];
    const weekStart = startOfWeek(start, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(end, { weekStartsOn: 1 });
    const shiftWhere: Record<string, unknown> = {
      startDate: { [Op.lte]: weekEnd },
      endDate: { [Op.gte]: weekStart },
    };
    this.applyLocationScope(shiftWhere, visibleIds, locationId);
    const assignments = await this.assignmentRepository.findAllWithShiftWhereAndUser(shiftWhere);
    const hoursByUser = new Map<string, number>();
    for (const a of assignments) {
      const shift = (a as { shift: Shift }).shift;
      if (!shift) continue;
      const intervals = expandShiftToIntervals(shift as any, { start: weekStart, end: weekEnd }, getShiftTimeZone(shift as any));
      const hours = intervals.reduce((sum, it) => sum + (it.end.getTime() - it.start.getTime()) / 3600000, 0);
      hoursByUser.set(a.userId, (hoursByUser.get(a.userId) ?? 0) + hours);
    }
    let userIds = [...hoursByUser.keys()];
    if (role) {
      const users = await this.userRepository.findAllByRole(role, ['id']);
      const roleIds = new Set(users.map((u) => u.id));
      userIds = userIds.filter((id) => roleIds.has(id));
    }
    if (locationId) {
      const staff = await this.locationRepository.findAllStaffLocationsByLocationId(locationId);
      const locIds = new Set(staff.map((s) => s.userId));
      userIds = userIds.filter((id) => locIds.has(id));
    }
    const result: DesiredHoursEntry[] = [];
    for (const userId of userIds) {
      const actualHours = Math.round((hoursByUser.get(userId) ?? 0) * 100) / 100;
      const desiredRow = await this.userRepository.findLatestDesiredHours(userId);
      const desiredWeeklyHours = desiredRow ? Number(desiredRow.weeklyHours) : 0;
      const diff = actualHours - desiredWeeklyHours;
      let status: 'under' | 'over' | 'ok' = 'ok';
      if (desiredWeeklyHours > 0) {
        if (diff < -1) status = 'under';
        else if (diff > 1) status = 'over';
      }
      const u = await this.userRepository.findByPk(userId, { attributes: ['name'] });
      result.push({
        userId,
        userName: u?.name ?? null,
        desiredWeeklyHours,
        actualHours,
        status,
        difference: Math.round(diff * 100) / 100,
      });
    }
    return result;
  }
}
