import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  addDays,
  endOfDay,
  getWeekStart as getWeekStartDate,
  hoursBetween,
  isInRange,
  startOfDay,
  toISODate,
  toOrdinal,
} from '../common/utils/date.utils';
import { ShiftAssignment, Shift } from '../database/models';
import { ShiftRepository } from '../database/repositories/shift.repository';
import { ShiftAssignmentRepository } from '../database/repositories/shift-assignment.repository';

/** Week start: 0=Sunday, 1=Monday (default), ... 6=Saturday */
const DEFAULT_WEEK_START = 1;
const WEEKLY_WARN_HOURS = 35;
const WEEKLY_BLOCK_HOURS = 40;
const DAILY_WARN_HOURS = 8;
const DAILY_BLOCK_HOURS = 12;
const CONSECUTIVE_WARN_DAYS = 6;
const CONSECUTIVE_OVERRIDE_DAYS = 7;

export interface OvertimeCheckResult {
  weeklyHours: number;
  weeklyWarn: boolean;
  weeklyBlock: boolean;
  dailyWarn: boolean;
  dailyBlock: boolean;
  consecutiveDays: number;
  consecutiveWarn: boolean;
  consecutiveRequireOverride: boolean;
  overtimeOverrideReason?: string | null;
}

export interface WhatIfResult extends OvertimeCheckResult {
  projectedWeeklyHours: number;
  projectedDailyHours: number;
  canAssign: boolean;
  message?: string;
}

export interface DashboardOvertimeEntry {
  userId: string;
  userName: string | null;
  weekStart: string;
  weeklyHours: number;
  overtimeHours: number;
  assignments: Array<{ shiftId: string; startAt: Date; endAt: Date; hours: number }>;
}

@Injectable()
export class OvertimeService {
  constructor(
    private readonly assignmentRepository: ShiftAssignmentRepository,
    private readonly shiftRepository: ShiftRepository,
    private readonly config: ConfigService,
  ) { }

  private getWeekStartDay(): number {
    return this.config.get<number>('CUSTOM_WEEK_START_DAY', DEFAULT_WEEK_START);
  }

  /** Get start of week (Monday by default) for a given date */
  getWeekStart(date: Date): Date {
    return getWeekStartDate(date, this.getWeekStartDay());
  }

  async getWeeklyHours(userId: string, weekStart: Date): Promise<number> {
    const weekEndDate = addDays(weekStart, 7);
    const assignments = await this.assignmentRepository.findAllByUserIdWithShiftInTimeWindow(
      userId,
      { startAtGte: weekStart, startAtLt: weekEndDate },
    );
    let total = 0;
    for (const a of assignments) {
      const s = (a as { shift: Shift }).shift;
      if (s) total += hoursBetween(s.startAt, s.endAt);
    }
    return total;
  }

  async getDailyHours(userId: string, date: Date): Promise<number> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const assignments = await this.assignmentRepository.findAllByUserIdWithShiftInTimeWindow(
      userId,
      { startAtGte: dayStart, endAtLte: dayEnd },
    );
    let total = 0;
    for (const a of assignments) {
      const s = (a as { shift: Shift }).shift;
      if (s) total += hoursBetween(s.startAt, s.endAt);
    }
    return total;
  }

  /** Count consecutive days with at least one assignment in the week; optionally include an extra date (e.g. for what-if) */
  async getConsecutiveDays(userId: string, weekStart: Date, includeDate?: Date): Promise<number> {
    const weekEndForConsec = addDays(weekStart, 7);
    const assignments = await this.assignmentRepository.findAllByUserIdWithShiftInTimeWindow(
      userId,
      { startAtGte: weekStart, startAtLt: weekEndForConsec },
    );
    const days = new Set<number>();
    for (const a of assignments) {
      const s = (a as { shift: Shift }).shift;
      if (s) days.add(toOrdinal(s.startAt));
    }
    if (includeDate && isInRange(includeDate, weekStart, weekEndForConsec)) {
      days.add(toOrdinal(includeDate));
    }
    const sorted = [...days].sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    let maxRun = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) run++;
      else run = 1;
      if (run > maxRun) maxRun = run;
    }
    return maxRun;
  }

  async checkOvertime(
    userId: string,
    weekStart: Date,
    date: Date,
    additionalHours?: number,
    overtimeOverrideReason?: string | null,
    includeDateForConsecutive?: Date,
  ): Promise<OvertimeCheckResult> {
    const weekly = await this.getWeeklyHours(userId, weekStart);
    const projectedWeekly = weekly + (additionalHours ?? 0);
    const daily = await this.getDailyHours(userId, date);
    const projectedDaily = daily + (additionalHours ?? 0);
    const consecutive = await this.getConsecutiveDays(userId, weekStart, includeDateForConsecutive);
    return {
      weeklyHours: projectedWeekly,
      weeklyWarn: projectedWeekly >= WEEKLY_WARN_HOURS,
      weeklyBlock: projectedWeekly >= WEEKLY_BLOCK_HOURS,
      dailyWarn: projectedDaily > DAILY_WARN_HOURS,
      dailyBlock: projectedDaily > DAILY_BLOCK_HOURS,
      consecutiveDays: consecutive,
      consecutiveWarn: consecutive >= CONSECUTIVE_WARN_DAYS,
      consecutiveRequireOverride: consecutive >= CONSECUTIVE_OVERRIDE_DAYS && !overtimeOverrideReason,
      overtimeOverrideReason: overtimeOverrideReason ?? undefined,
    };
  }

  async whatIf(
    userId: string,
    assignmentStart: Date,
    assignmentEnd: Date,
    overtimeOverrideReason?: string | null,
  ): Promise<WhatIfResult> {
    const weekStart = this.getWeekStart(assignmentStart);
    const additionalHours = hoursBetween(assignmentStart, assignmentEnd);
    const check = await this.checkOvertime(
      userId,
      weekStart,
      assignmentStart,
      additionalHours,
      overtimeOverrideReason,
      assignmentStart,
    );
    const projectedWeekly = (await this.getWeeklyHours(userId, weekStart)) + additionalHours;
    const projectedDaily = (await this.getDailyHours(userId, assignmentStart)) + additionalHours;
    let canAssign = true;
    const messages: string[] = [];
    if (check.weeklyBlock) {
      canAssign = false;
      messages.push(`Weekly hours would exceed ${WEEKLY_BLOCK_HOURS}h (${projectedWeekly.toFixed(1)}h).`);
    }
    if (check.dailyBlock) {
      canAssign = false;
      messages.push(`Daily hours would exceed ${DAILY_BLOCK_HOURS}h (${projectedDaily.toFixed(1)}h).`);
    }
    if (check.consecutiveRequireOverride) {
      canAssign = false;
      messages.push('7 consecutive days requires manager override with documented reason.');
    }
    if (check.weeklyWarn && !check.weeklyBlock) messages.push(`Weekly hours at or above ${WEEKLY_WARN_HOURS}h.`);
    if (check.dailyWarn && !check.dailyBlock) messages.push(`Daily hours over ${DAILY_WARN_HOURS}h.`);
    if (check.consecutiveWarn && !check.consecutiveRequireOverride) messages.push('6+ consecutive days worked.');
    return {
      ...check,
      projectedWeeklyHours: projectedWeekly,
      projectedDailyHours: projectedDaily,
      canAssign,
      message: messages.length ? messages.join(' ') : undefined,
    };
  }

  async getDashboardData(
    locationId: string | null,
    start: Date,
    end: Date,
  ): Promise<DashboardOvertimeEntry[]> {
    const shifts = await this.shiftRepository.findAllInRangeWithAssignmentsAndUser(
      start,
      end,
      locationId,
    );
    type WeekData = { hours: number; assignments: Array<{ shiftId: string; startAt: Date; endAt: Date; hours: number }> };
    const byUser = new Map<string, { userName: string | null; weekStarts: Map<string, WeekData> }>();
    for (const shift of shifts) {
      const ass = (shift as { assignments?: ShiftAssignment[] }).assignments;
      for (const a of ass || []) {
        const user = (a as { user?: { name: string | null } }).user;
        const userId = a.userId;
        const weekStart = this.getWeekStart(shift.startAt);
        const weekKey = toISODate(weekStart);
        const hours = hoursBetween(shift.startAt, shift.endAt);
        if (!byUser.has(userId)) {
          byUser.set(userId, {
            userName: user?.name ?? null,
            weekStarts: new Map(),
          });
        }
        const u = byUser.get(userId)!;
        if (!u.weekStarts.has(weekKey)) {
          u.weekStarts.set(weekKey, { hours: 0, assignments: [] });
        }
        const w = u.weekStarts.get(weekKey)!;
        w.hours += hours;
        w.assignments.push({
          shiftId: shift.id,
          startAt: shift.startAt,
          endAt: shift.endAt,
          hours,
        });
      }
    }
    const result: DashboardOvertimeEntry[] = [];
    for (const [userId, data] of byUser) {
      for (const [weekStart, weekData] of data.weekStarts) {
        const overtimeHours = Math.max(0, weekData.hours - WEEKLY_BLOCK_HOURS);
        result.push({
          userId,
          userName: data.userName,
          weekStart,
          weeklyHours: weekData.hours,
          overtimeHours,
          assignments: weekData.assignments,
        });
      }
    }
    return result.sort((a, b) => a.weekStart.localeCompare(b.weekStart) || (a.userName ?? '').localeCompare(b.userName ?? ''));
  }
}
