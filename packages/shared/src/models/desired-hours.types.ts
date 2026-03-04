import type { Id } from '../common';
import type { ModelAttributes } from '../common';

export interface DesiredHoursBaseAttributes {
  userId: Id;
  weeklyHours: string;
  effectiveFrom: string;
}

export interface DesiredHoursBaseAttributesWithId extends DesiredHoursBaseAttributes {
  id: Id;
}

export interface DesiredHoursAttributes
  extends DesiredHoursBaseAttributes,
    ModelAttributes {}
