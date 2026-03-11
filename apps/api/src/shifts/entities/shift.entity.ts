import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ShiftEntity {
  @Field()
  id: string;

  @Field()
  locationId: string;

  @Field()
  startAt: Date;

  @Field()
  endAt: Date;

  @Field()
  published: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
