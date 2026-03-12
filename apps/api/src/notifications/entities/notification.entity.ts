import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class NotificationEntity {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  type: string;

  @Field(() => String, { nullable: true })
  title: string | null;

  @Field(() => String, { nullable: true })
  body: string | null;

  @Field(() => Boolean, { nullable: true })
  read: boolean;

  @Field()
  createdAt: Date;
}
