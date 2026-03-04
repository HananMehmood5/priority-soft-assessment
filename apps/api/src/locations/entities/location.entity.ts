import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class LocationEntity {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  timezone: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
