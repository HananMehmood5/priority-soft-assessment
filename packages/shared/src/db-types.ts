/**
 * DB-layer attribute types: same as shared *Attributes but with Date for
 * timestamps and date fields so Sequelize and repositories type-check.
 * Use shared *Attributes (string dates) at API boundary / JSON.
 */

import type { AuditLogAttributes } from './models/audit-log.types';
import type { AvailabilityAttributes } from './models/availability.types';
import type { AvailabilityExceptionAttributes } from './models/availability-exception.types';
import type { DesiredHoursAttributes } from './models/desired-hours.types';
import type { LocationAttributes } from './models/location.types';
import type { ManagerLocationAttributes } from './models/manager-location.types';
import type { NotificationAttributes } from './models/notification.types';
import type { NotificationPreferenceAttributes } from './models/notification-preference.types';
import type { ShiftAssignmentAttributes } from './models/shift-assignment.types';
import type { ShiftBaseAttributes, ShiftAttributes } from './models/shift.types';
import type { ShiftRequestAttributes } from './models/shift-request.types';
import type { SkillAttributes } from './models/skill.types';
import type { StaffLocationAttributes } from './models/staff-location.types';
import type { StaffSkillAttributes } from './models/staff-skill.types';
import type { UserAttributes } from './models/user.types';

export type WithDates<T, K extends keyof T> = Omit<T, K> & { [P in K]: Date };

export type UserAttributesDb = WithDates<UserAttributes, 'createdAt' | 'updatedAt'>;
export type LocationAttributesDb = WithDates<LocationAttributes, 'createdAt' | 'updatedAt'>;
export type SkillAttributesDb = WithDates<SkillAttributes, 'createdAt' | 'updatedAt'>;

/** Creation payload at DB layer: startAt/endAt are Date. */
export interface ShiftBaseAttributesDb extends Omit<ShiftBaseAttributes, 'startAt' | 'endAt'> {
  startAt: Date;
  endAt: Date;
}

export type ShiftAttributesDb = WithDates<
  ShiftAttributes,
  'createdAt' | 'updatedAt' | 'startAt' | 'endAt'
>;
export type ShiftAssignmentAttributesDb = WithDates<
  ShiftAssignmentAttributes,
  'createdAt' | 'updatedAt'
>;
export type ShiftRequestAttributesDb = WithDates<
  ShiftRequestAttributes,
  'createdAt' | 'updatedAt'
>;
export type NotificationAttributesDb = WithDates<NotificationAttributes, 'createdAt'>;
export type NotificationPreferenceAttributesDb = WithDates<
  NotificationPreferenceAttributes,
  'createdAt' | 'updatedAt'
>;
export type AuditLogAttributesDb = WithDates<AuditLogAttributes, 'createdAt'>;
export type AvailabilityAttributesDb = WithDates<
  AvailabilityAttributes,
  'createdAt' | 'updatedAt'
>;
export type AvailabilityExceptionAttributesDb = WithDates<
  AvailabilityExceptionAttributes,
  'createdAt' | 'updatedAt'
>;
export type DesiredHoursAttributesDb = WithDates<
  DesiredHoursAttributes,
  'createdAt' | 'updatedAt'
>;
export type ManagerLocationAttributesDb = WithDates<
  ManagerLocationAttributes,
  'createdAt' | 'updatedAt'
>;
export type StaffLocationAttributesDb = WithDates<
  StaffLocationAttributes,
  'createdAt' | 'updatedAt'
>;
export type StaffSkillAttributesDb = WithDates<
  StaffSkillAttributes,
  'createdAt' | 'updatedAt'
>;
