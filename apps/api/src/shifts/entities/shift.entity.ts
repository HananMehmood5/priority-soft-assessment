import { ObjectType, Field } from '@nestjs/graphql';
import { ShiftAssignmentEntity } from './shift-assignment.entity';
import { LocationEntity } from '../../locations/entities/location.entity';

@ObjectType()
export class ShiftEntity {
  @Field()
  id: string;

  @Field()
  locationId: string;

  @Field()
  startAt: Date;

  @Field()
  endAt: Date;

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
