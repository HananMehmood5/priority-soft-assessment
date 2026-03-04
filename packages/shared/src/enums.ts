export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Staff = 'Staff',
}

export enum RequestType {
  Swap = 'swap',
  Drop = 'drop',
}

export enum RequestStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Approved = 'approved',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
}

export enum AuditAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export enum AuditEntityType {
  Shift = 'shift',
  ShiftAssignment = 'shift_assignment',
}
