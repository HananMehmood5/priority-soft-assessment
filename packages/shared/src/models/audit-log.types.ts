import type { Id } from '../common';
import type { ModelAttributesWithoutUpdatedAt } from '../common';
import type { AuditAction, AuditEntityType } from '../enums';

export interface AuditLogBaseAttributes {
  userId: Id;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: Id;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface AuditLogBaseAttributesWithId extends AuditLogBaseAttributes {
  id: Id;
}

export interface AuditLogAttributes
  extends AuditLogBaseAttributes,
    ModelAttributesWithoutUpdatedAt {}
