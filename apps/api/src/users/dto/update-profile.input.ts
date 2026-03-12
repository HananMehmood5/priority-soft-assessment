import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class AvailabilitySlotInput {
  @Field(() => Int)
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Field()
  @IsString()
  startTime: string;

  @Field()
  @IsString()
  endTime: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  locationId?: string;
}

@InputType()
export class UpdateProfileInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => [AvailabilitySlotInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotInput)
  availabilities?: AvailabilitySlotInput[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  desiredWeeklyHours?: number;
}
