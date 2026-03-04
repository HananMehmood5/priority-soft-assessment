import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { ShiftLiteAttributes } from './shift-lite.types';
import type { SkillLiteAttributes, UserLiteAttributes } from '../lite';

export interface ShiftAssignmentBaseAttributes {
  shiftId: Id;
  userId: Id;
  skillId: Id;
  version?: number;
  overtimeOverrideReason?: string | null;
}

export interface ShiftAssignmentBaseAttributesWithId
  extends ShiftAssignmentBaseAttributes {
  id: Id;
}

export interface ShiftAssignmentAttributes
  extends ShiftAssignmentBaseAttributes,
    ModelAttributes {
  shift?: ShiftLiteAttributes;
  user?: UserLiteAttributes;
  skill?: SkillLiteAttributes;
}
