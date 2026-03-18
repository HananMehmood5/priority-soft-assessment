import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class SkillEntity {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => Int)
  staffCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
