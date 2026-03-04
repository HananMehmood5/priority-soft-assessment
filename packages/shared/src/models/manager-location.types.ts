import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { LocationLiteAttributes, UserLiteAttributes } from '../lite';

export interface ManagerLocationBaseAttributes {
  userId: Id;
  locationId: Id;
}

export interface ManagerLocationBaseAttributesWithId
  extends ManagerLocationBaseAttributes {
  id: Id;
}

export interface ManagerLocationAttributes
  extends ManagerLocationBaseAttributes,
    ModelAttributes {
  user?: UserLiteAttributes;
  location?: LocationLiteAttributes;
}
