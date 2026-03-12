import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { RequestType, RequestStatus } from '@shiftsync/shared';
import { ShiftAssignmentEntity } from '../../shifts/entities/shift-assignment.entity';
import { UserEntity } from '../../auth/entities/user.entity';

registerEnumType(RequestType, { name: 'RequestType' });
registerEnumType(RequestStatus, { name: 'RequestStatus' });

@ObjectType()
export class RequestEntity {
  @Field()
  id: string;

  @Field(() => String)
  type: RequestType;

  @Field()
  assignmentId: string;

  @Field(() => String, { nullable: true })
  counterpartAssignmentId: string | null;

  @Field(() => String, { nullable: true })
  claimerUserId: string | null;

  @Field(() => String)
  status: RequestStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
