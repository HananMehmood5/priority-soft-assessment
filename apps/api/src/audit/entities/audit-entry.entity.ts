import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuditEntryEntity {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  action: string;

  @Field()
  entityType: string;

  @Field()
  entityId: string;

  @Field({ nullable: true })
  before: string | null;

  @Field({ nullable: true })
  after: string | null;

  @Field()
  createdAt: Date;
}
