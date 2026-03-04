import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { UserLiteAttributes } from '../lite';

export interface LocationBaseAttributes {
  name: string;
  timezone: string;
}

export interface LocationBaseAttributesWithId extends LocationBaseAttributes {
  id: Id;
}

export interface LocationAttributes extends LocationBaseAttributes, ModelAttributes {
  managers?: UserLiteAttributes[];
  certifiedStaff?: UserLiteAttributes[];
}
