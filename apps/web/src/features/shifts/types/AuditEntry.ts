export type AuditEntry = {
  id: string;
  userId: string;
  entityId: string;
  entityType: string;
  action: string;
  createdAt: string;
  before?: string | null;
  after?: string | null;
  user?: { id: string; name: string | null; email: string | null } | null;
};

