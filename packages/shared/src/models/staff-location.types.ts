import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { LocationLiteAttributes, UserLiteAttributes } from '../lite';

export interface StaffLocationBaseAttributes {
  userId: Id;
  locationId: Id;
}

export interface StaffLocationBaseAttributesWithId
  extends StaffLocationBaseAttributes {
  id: Id;
}

export interface StaffLocationAttributes
  extends StaffLocationBaseAttributes,
    ModelAttributes {
  user?: UserLiteAttributes;
  location?: LocationLiteAttributes;
}
