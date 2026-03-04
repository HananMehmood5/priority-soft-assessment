import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SkillEntity {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
