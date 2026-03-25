import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ShiftAssignmentEntity } from './shift-assignment.entity';
import { LocationEntity } from '../../locations/entities/location.entity';

@ObjectType()
export class ShiftEntity {
  @Field()
  id: string;

  @Field()
  locationId: string;

  @Field()
  startDate: string;

  @Field()
  endDate: string;

  @Field(() => [Int])
  daysOfWeek: number[];

  @Field()
  dailyStartTime: string;

  @Field()
  dailyEndTime: string;

  @Field()
  requiredSkillId: string;

  @Field(() => Int)
  headcountNeeded: number;

  @Field()
  published: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ShiftAssignmentEntity], { nullable: 'itemsAndList' })
  assignments?: ShiftAssignmentEntity[];

  @Field(() => LocationEntity, { nullable: true })
  location?: unknown;
}
