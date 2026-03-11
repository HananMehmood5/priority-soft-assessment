import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateShiftInput {
  @Field()
  @IsUUID()
  locationId: string;

  @Field()
  @IsDate()
  @Type(() => Date)
  startAt: Date;

  @Field()
  @IsDate()
  @Type(() => Date)
  endAt: Date;
}
