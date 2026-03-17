import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@shiftsync/shared';
import { SkillEntity } from '../../skills/entities/skill.entity';
import { LocationEntity } from '../../locations/entities/location.entity';

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
export class UserEntity {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [SkillEntity], { nullable: true })
  skills?: unknown;

  @Field(() => [LocationEntity], { nullable: true })
  certifiedLocations?: unknown;
}
