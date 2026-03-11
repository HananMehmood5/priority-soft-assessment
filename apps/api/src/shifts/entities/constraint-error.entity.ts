import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class EligibleStaffSuggestion {
  @Field()
  id: string;

  @Field({ nullable: true })
  name: string | null;
}

@ObjectType()
export class ConstraintErrorEntity {
  @Field()
  message: string;

  @Field(() => [EligibleStaffSuggestion], { nullable: true })
  alternatives?: Array<{ id: string; name: string | null }>;
}
