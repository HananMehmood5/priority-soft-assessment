import type { Id } from '../common';

/** Minimal shift fields for nested relations (e.g. ShiftAssignment.shift). */
export interface ShiftLiteAttributes {
  id: Id;
  locationId: Id;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  published: boolean;
}
