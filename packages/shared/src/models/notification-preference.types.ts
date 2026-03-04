import type { Id } from '../common';
import type { ModelAttributes } from '../common';

export interface NotificationPreferenceBaseAttributes {
  userId: Id;
  channel: string;
  enabled?: boolean;
}

export interface NotificationPreferenceBaseAttributesWithId
  extends NotificationPreferenceBaseAttributes {
  id: Id;
}

export interface NotificationPreferenceAttributes
  extends NotificationPreferenceBaseAttributes,
    ModelAttributes {}
