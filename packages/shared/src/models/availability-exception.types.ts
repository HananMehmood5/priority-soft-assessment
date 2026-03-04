import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { LocationLiteAttributes } from '../lite';

export interface AvailabilityExceptionBaseAttributes {
  userId: Id;
  locationId: Id | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
}

export interface AvailabilityExceptionBaseAttributesWithId
  extends AvailabilityExceptionBaseAttributes {
  id: Id;
}

export interface AvailabilityExceptionAttributes
  extends AvailabilityExceptionBaseAttributes,
    ModelAttributes {
  location?: LocationLiteAttributes | null;
}
