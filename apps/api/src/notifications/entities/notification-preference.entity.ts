import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class NotificationPreferenceEntity {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  channel: string;

  @Field()
  enabled: boolean;
}
