import type { Id } from '../common';
import type { ModelAttributesWithoutUpdatedAt } from '../common';

export interface NotificationBaseAttributes {
  userId: Id;
  type: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown> | null;
  read?: boolean;
}

export interface NotificationBaseAttributesWithId
  extends NotificationBaseAttributes {
  id: Id;
}

export interface NotificationAttributes
  extends NotificationBaseAttributes,
    ModelAttributesWithoutUpdatedAt {}
