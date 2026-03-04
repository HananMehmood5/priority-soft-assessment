import type { Id } from './common';
import type { UserRole } from './enums';

/** Minimal user fields for nested relations (e.g. Location.managers, Skill.staff). */
export interface UserLiteAttributes {
  id: Id;
  email: string;
  name: string | null;
  role: UserRole;
}

/** Minimal location fields for nested relations. */
export interface LocationLiteAttributes {
  id: Id;
  name: string;
  timezone: string;
}

/** Minimal skill fields for nested relations. */
export interface SkillLiteAttributes {
  id: Id;
  name: string;
}
