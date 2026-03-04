import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { SkillLiteAttributes, UserLiteAttributes } from '../lite';

export interface StaffSkillBaseAttributes {
  userId: Id;
  skillId: Id;
}

export interface StaffSkillBaseAttributesWithId extends StaffSkillBaseAttributes {
  id: Id;
}

export interface StaffSkillAttributes
  extends StaffSkillBaseAttributes,
    ModelAttributes {
  user?: UserLiteAttributes;
  skill?: SkillLiteAttributes;
}
