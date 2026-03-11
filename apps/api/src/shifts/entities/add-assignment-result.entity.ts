import { ObjectType, Field } from '@nestjs/graphql';
import { ShiftAssignmentEntity } from './shift-assignment.entity';
import { ConstraintErrorEntity } from './constraint-error.entity';

@ObjectType()
export class AddAssignmentResult {
  @Field(() => ShiftAssignmentEntity, { nullable: true })
  assignment?: ShiftAssignmentEntity;

  @Field(() => ConstraintErrorEntity, { nullable: true })
  constraintError?: ConstraintErrorEntity;
}
