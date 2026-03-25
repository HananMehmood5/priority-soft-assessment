import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsInt, Max, Min, IsString, IsUUID } from 'class-validator';

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

  @Field(() => [Int])
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[];

  @Field()
  @IsString()
  dailyStartTime: string;

  @Field()
  @IsString()
  dailyEndTime: string;
}
