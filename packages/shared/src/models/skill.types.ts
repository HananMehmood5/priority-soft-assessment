import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { UserLiteAttributes } from '../lite';

export interface SkillBaseAttributes {
  name: string;
}

export interface SkillBaseAttributesWithId extends SkillBaseAttributes {
  id: Id;
}

export interface SkillAttributes extends SkillBaseAttributes, ModelAttributes {
  staff?: UserLiteAttributes[];
}
