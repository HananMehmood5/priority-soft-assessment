import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class NotificationEntity {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  title: string | null;

  @Field({ nullable: true })
  body: string | null;

  @Field({ nullable: true })
  read: boolean;

  @Field()
  createdAt: Date;
}
