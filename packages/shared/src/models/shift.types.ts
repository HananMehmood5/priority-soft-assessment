import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { LocationLiteAttributes } from '../lite';
import type { ShiftAssignmentAttributes } from './shift-assignment.types';

export interface ShiftBaseAttributes {
  locationId: Id;
  /** First calendar date of the shift template (YYYY-MM-DD, location timezone). */
  startDate: string;
  /** Last calendar date of the shift template (YYYY-MM-DD, location timezone). */
  endDate: string;
  /**
   * Weekdays the shift occurs on within `startDate`–`endDate`.
   * 0=Sunday, 1=Monday, ... 6=Saturday.
   */
  daysOfWeek: number[];
  /** Daily start time (HH:mm) in location timezone. */
  dailyStartTime: string;
  /** Daily end time (HH:mm) in location timezone; may be <= dailyStartTime for overnight patterns. */
  dailyEndTime: string;
  /** Skill required for staff assigned to this shift. */
  requiredSkillId: Id;
  /** Number of staff that must be assigned to this shift. */
  headcountNeeded: number;
  published?: boolean;
}

export interface ShiftBaseAttributesWithId extends ShiftBaseAttributes {
  id: Id;
}

export interface ShiftAttributes extends ShiftBaseAttributes, ModelAttributes {
  location?: LocationLiteAttributes;
  assignments?: ShiftAssignmentAttributes[];
}
