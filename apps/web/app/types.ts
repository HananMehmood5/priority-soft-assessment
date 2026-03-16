/**
 * Re-export shared types for use across the frontend.
 * Use these for API response typing, form payloads, and component props.
 * @see .cursor/plans/phase-3-frontend.plan.md
 */
export type {
  UserAttributes,
  UserLiteAttributes,
  LocationAttributes,
  LocationLiteAttributes,
  SkillAttributes,
  SkillLiteAttributes,
  ShiftAttributes,
  ShiftAssignmentAttributes,
  ShiftRequestAttributes,
  NotificationAttributes,
  Id,
} from '@shiftsync/shared';
export {
  UserRole,
  RequestType,
  RequestStatus,
  AuditAction,
  AuditEntityType,
} from '@shiftsync/shared';
