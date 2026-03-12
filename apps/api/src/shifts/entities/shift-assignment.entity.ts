import { ObjectType, Field } from '@nestjs/graphql';
import { ShiftEntity } from './shift.entity';

@ObjectType()
export class ShiftAssignmentEntity {
  @Field()
  id: string;

  @Field()
  shiftId: string;

  @Field()
  userId: string;

  @Field()
  skillId: string;

  @Field()
  version: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => ShiftEntity, { nullable: true })
  shift?: unknown;
}
