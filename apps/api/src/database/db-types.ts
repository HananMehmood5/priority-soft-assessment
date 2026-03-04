/**
 * DB-layer attribute types: same as shared Attributes but with Date for
 * timestamps and date fields so Sequelize and repositories type-check.
 * Use shared *Attributes (string dates) at API boundary / JSON.
 */

import type {
  AuditLogAttributes,
  AvailabilityAttributes,
  AvailabilityExceptionAttributes,
  DesiredHoursAttributes,
  LocationAttributes,
  ManagerLocationAttributes,
  NotificationAttributes,
  NotificationPreferenceAttributes,
  ShiftAssignmentAttributes,
  ShiftBaseAttributes,
  ShiftRequestAttributes,
  ShiftAttributes,
  SkillAttributes,
  StaffLocationAttributes,
  StaffSkillAttributes,
  UserAttributes,
} from '@shiftsync/shared';

type WithDates<T, K extends keyof T> = Omit<T, K> &
  { [P in K]: Date };

export type UserAttributesDb = WithDates<UserAttributes, 'createdAt' | 'updatedAt'>;
export type LocationAttributesDb = WithDates<LocationAttributes, 'createdAt' | 'updatedAt'>;
export type SkillAttributesDb = WithDates<SkillAttributes, 'createdAt' | 'updatedAt'>;

/** Creation payload at DB layer: startAt/endAt are Date. */
export interface ShiftBaseAttributesDb
  extends Omit<ShiftBaseAttributes, 'startAt' | 'endAt'> {
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
