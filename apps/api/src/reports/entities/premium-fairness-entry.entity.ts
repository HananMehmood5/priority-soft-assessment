import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PremiumFairnessEntryEntity {
  @Field()
  userId: string;

  @Field(() => String, { nullable: true })
  userName: string | null;

  @Field()
  premiumShiftCount: number;

  @Field()
  totalShiftCount: number;

  @Field()
  totalHours: number;

  @Field()
  fairnessScore: number;
}
