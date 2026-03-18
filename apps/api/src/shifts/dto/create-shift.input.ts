import { Field, InputType } from '@nestjs/graphql';
import { IsUUID, IsString } from 'class-validator';

@InputType()
export class CreateShiftInput {
  @Field()
  @IsUUID()
  locationId: string;

  @Field()
  @IsString()
  startDate: string;

  @Field()
  @IsString()
  endDate: string;

  @Field()
  @IsString()
  dailyStartTime: string;

  @Field()
  @IsString()
  dailyEndTime: string;
}
