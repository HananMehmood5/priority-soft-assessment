import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { LocationLiteAttributes } from '../lite';

export interface AvailabilityBaseAttributes {
  userId: Id;
  locationId: Id | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityBaseAttributesWithId extends AvailabilityBaseAttributes {
  id: Id;
}

export interface AvailabilityAttributes extends AvailabilityBaseAttributes, ModelAttributes {
  location?: LocationLiteAttributes | null;
}
