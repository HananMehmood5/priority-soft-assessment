import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Shift } from '../database/models';
import { ShiftRepository } from '../database/repositories/shift.repository';
import { ShiftAssignmentRepository } from '../database/repositories/shift-assignment.repository';
import { LocationRepository } from '../database/repositories/location.repository';
import { SkillRepository } from '../database/repositories/skill.repository';
import { UserRepository } from '../database/repositories/user.repository';

export interface ConstraintResult {
  valid: boolean;
  message?: string;
  alternatives?: Array<{ id: string; name: string | null }>;
}

@Injectable()
export class ConstraintsService {
  constructor(
    private readonly assignmentRepository: ShiftAssignmentRepository,
    private readonly locationRepository: LocationRepository,
    private readonly skillRepository: SkillRepository,
    private readonly userRepository: UserRepository,
  ) { }

  /** Check if user is double-booked (overlapping assigned shifts) */
  async checkDoubleBook(
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeAssignmentId?: string,
  ): Promise<ConstraintResult> {
    const overlaps = await this.assignmentRepository.findAllByUserIdWithShift(userId);
    const start = startAt.getTime();
    const end = endAt.getTime();

    for (const a of overlaps) {
      if (excludeAssignmentId && a.id === excludeAssignmentId) continue;
      const s = (a as { shift: Shift }).shift;
      const sStart = (s.startAt as Date).getTime();
      const sEnd = (s.endAt as Date).getTime();
      if (start < sEnd && end > sStart) {
        return {
          valid: false,
          message: `Staff is already assigned to another shift that overlaps (${(s.startAt as Date).toISOString()} - ${(s.endAt as Date).toISOString()}).`,
        };
      }
    }
    return { valid: true };
  }

  /** Min 10h between shifts */
  async checkRest(
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeAssignmentId?: string,
  ): Promise<ConstraintResult> {
    const TEN_HOURS_MS = 10 * 60 * 60 * 1000;
    const assignments = await this.assignmentRepository.findAllByUserIdWithShift(userId);
    for (const a of assignments) {
      if (excludeAssignmentId && a.id === excludeAssignmentId) continue;
      const s = (a as { shift: Shift }).shift;
      const sStart = (s.startAt as Date).getTime();
      const sEnd = (s.endAt as Date).getTime();
      const gapBefore = startAt.getTime() - sEnd;
      const gapAfter = sStart - endAt.getTime();
      if (gapBefore > 0 && gapBefore < TEN_HOURS_MS) {
        return {
          valid: false,
          message: `Less than 10 hours rest before this shift (previous shift ends ${(s.endAt as Date).toISOString()}).`,
        };
      }
      if (gapAfter > 0 && gapAfter < TEN_HOURS_MS) {
        return {
          valid: false,
          message: `Less than 10 hours rest after this shift (next shift starts ${(s.startAt as Date).toISOString()}).`,
        };
      }
    }
    return { valid: true };
  }

  async checkSkill(userId: string, skillId: string): Promise<ConstraintResult> {
    const has = await this.skillRepository.findStaffSkill(userId, skillId);
    if (!has) {
      return {
        valid: false,
        message: 'Staff does not have the required skill for this assignment.',
      };
    }
    return { valid: true };
  }

  async checkLocation(userId: string, locationId: string): Promise<ConstraintResult> {
    const has = await this.locationRepository.findStaffLocation(userId, locationId);
    if (!has) {
      return {
        valid: false,
        message: 'Staff is not certified at this location.',
      };
    }
    return { valid: true };
  }

  /** Check availability in location local time (recurring + exceptions) */
  async checkAvailability(
    userId: string,
    locationId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<ConstraintResult> {
    const location = await this.locationRepository.findById(locationId);
    if (!location) return { valid: true };
    const tz = (location as { timezone: string }).timezone;
    const startLocal = DateTime.fromJSDate(startAt, { zone: tz });
    const endLocal = DateTime.fromJSDate(endAt, { zone: tz });
    const dateStr = startLocal.toISODate();
    if (!dateStr) return { valid: true };
    const dayOfWeek = startLocal.weekday === 7 ? 0 : startLocal.weekday; // Luxon Mon=1, Sun=7 -> we use 0=Sun
    const startTime = startLocal.toFormat('HH:mm');
    const endTime = endLocal.toFormat('HH:mm');

    const blockingException = await this.userRepository.findExceptionForUserDate(
      userId,
      dateStr,
      locationId,
    );
    if (blockingException) {
      const ex = blockingException as { allDay?: boolean; startTime?: string; endTime?: string };
      if (ex.allDay) {
        return { valid: false, message: 'Staff has an all-day availability exception on this date.' };
      }
      const exStart = ex.startTime as string;
      const exEnd = ex.endTime as string;
      if (exStart && exEnd && this.timeRangesOverlap(startTime, endTime, exStart, exEnd)) {
        return { valid: false, message: 'Staff has an availability exception that overlaps this shift.' };
      }
    }

    const availabilities = await this.userRepository.findAvailabilityForUserDayLocation(
      userId,
      dayOfWeek,
      locationId,
    );
    if (availabilities.length === 0) {
      return { valid: false, message: 'Staff has no recurring availability for this day and location.' };
    }
    const covered = availabilities.some((a) => {
      const slotStart = (a as { startTime: string }).startTime;
      const slotEnd = (a as { endTime: string }).endTime;
      return this.timeRangeContains(slotStart, slotEnd, startTime, endTime);
    });
    if (!covered) {
      return { valid: false, message: 'Shift time is outside staff recurring availability window.' };
    }
    return { valid: true };
  }

  private timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  private timeRangeContains(slotStart: string, slotEnd: string, start: string, end: string): boolean {
    return slotStart <= start && slotEnd >= end;
  }

  /** Run all assignment checks; returns first failure or success */
  async validateAssignment(
    userId: string,
    locationId: string,
    skillId: string,
    startAt: Date,
    endAt: Date,
    excludeAssignmentId?: string,
  ): Promise<ConstraintResult> {
    let r = await this.checkDoubleBook(userId, startAt, endAt, excludeAssignmentId);
    if (!r.valid) return r;
    r = await this.checkRest(userId, startAt, endAt, excludeAssignmentId);
    if (!r.valid) return r;
    r = await this.checkSkill(userId, skillId);
    if (!r.valid) return r;
    r = await this.checkLocation(userId, locationId);
    if (!r.valid) return r;
    r = await this.checkAvailability(userId, locationId, startAt, endAt);
    if (!r.valid) return r;
    return { valid: true };
  }

  /** Return staff who are eligible for this assignment (have skill, location cert, and availability) */
  async getAlternatives(
    locationId: string,
    skillId: string,
    startAt: Date,
    endAt: Date,
    excludeUserId?: string,
  ): Promise<Array<{ id: string; name: string | null }>> {
    const certified = await this.locationRepository.findAllStaffLocationsByLocationId(locationId);
    const userIds = [...new Set(certified.map((c) => c.userId))].filter((id) => id !== excludeUserId);
    const withSkill = await this.skillRepository.findAllStaffSkillsBySkillAndUserIds(skillId, userIds);
    const candidateIds = [...new Set(withSkill.map((s) => s.userId))];
    const eligible: Array<{ id: string; name: string | null }> = [];
    for (const uid of candidateIds) {
      const result = await this.validateAssignment(uid, locationId, skillId, startAt, endAt);
      if (result.valid) {
        const user = await this.userRepository.findByPk(uid, { attributes: ['id', 'name'] });
        if (user) eligible.push({ id: user.id, name: user.name });
      }
    }
    return eligible;
  }
}
