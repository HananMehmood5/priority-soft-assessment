import { ObjectType, Field } from '@nestjs/graphql';
import { RequestEntity } from './request.entity';
import { ConstraintErrorEntity } from '../../shifts/entities/constraint-error.entity';

@ObjectType()
export class AcceptRequestResult {
  @Field(() => RequestEntity, { nullable: true })
  request?: RequestEntity;

  @Field(() => ConstraintErrorEntity, { nullable: true })
  constraintError?: ConstraintErrorEntity;
}
