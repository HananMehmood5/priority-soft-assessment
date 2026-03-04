import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { LocationLiteAttributes } from '../lite';
import type { ShiftAssignmentAttributes } from './shift-assignment.types';

export interface ShiftBaseAttributes {
  locationId: Id;
  startAt: string;
  endAt: string;
  published?: boolean;
}

export interface ShiftBaseAttributesWithId extends ShiftBaseAttributes {
  id: Id;
}

export interface ShiftAttributes extends ShiftBaseAttributes, ModelAttributes {
  location?: LocationLiteAttributes;
  assignments?: ShiftAssignmentAttributes[];
}
