import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { UserRole } from '../enums';
import type { AvailabilityAttributes } from './availability.types';
import type { AvailabilityExceptionAttributes } from './availability-exception.types';
import type { DesiredHoursAttributes } from './desired-hours.types';
import type { LocationAttributes } from './location.types';
import type { SkillAttributes } from './skill.types';

export interface UserBaseAttributes {
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string | null;
}

export interface UserBaseAttributesWithId extends UserBaseAttributes {
  id: Id;
}

export interface UserAttributes
  extends Omit<UserBaseAttributes, 'passwordHash'>,
    ModelAttributes {
  availabilities?: AvailabilityAttributes[];
  availabilityExceptions?: AvailabilityExceptionAttributes[];
  desiredHours?: DesiredHoursAttributes[];
  managedLocations?: LocationAttributes[];
  certifiedLocations?: LocationAttributes[];
  skills?: SkillAttributes[];
}
