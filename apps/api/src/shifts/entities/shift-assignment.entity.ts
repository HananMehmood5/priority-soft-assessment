import { ObjectType, Field } from '@nestjs/graphql';
import { ShiftEntity } from './shift.entity';
import { UserEntity } from '../../auth/entities/user.entity';
import { SkillEntity } from '../../skills/entities/skill.entity';

@ObjectType()
export class ShiftAssignmentEntity {
  @Field()
  id: string;

  @Field()
  shiftId: string;

  @Field()
  userId: string;

  @Field()
  skillId: string;

  @Field()
  version: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => ShiftEntity, { nullable: true })
  shift?: unknown;

  @Field(() => UserEntity, { nullable: true })
  user?: unknown;

  @Field(() => SkillEntity, { nullable: true })
  skill?: unknown;
}
