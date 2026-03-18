import { ObjectType, Field } from '@nestjs/graphql';
import { UserEntity } from '../../auth/entities/user.entity';

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

  @Field(() => String, { nullable: true })
  before: string | null;

  @Field(() => String, { nullable: true })
  after: string | null;

  @Field()
  createdAt: Date;

  @Field(() => UserEntity, { nullable: true })
  user?: UserEntity | null;
}
