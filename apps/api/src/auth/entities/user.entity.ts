import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@shiftsync/shared';

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
export class UserEntity {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
