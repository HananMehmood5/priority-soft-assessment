import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class DistributionEntryEntity {
  @Field()
  userId: string;

  @Field({ nullable: true })
  userName: string | null;

  @Field()
  totalHours: number;
}
