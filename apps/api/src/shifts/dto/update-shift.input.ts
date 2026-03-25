import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsInt, IsOptional, Max, Min, IsString, IsUUID } from 'class-validator';

@InputType()
export class UpdateShiftInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  endDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  dailyStartTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  dailyEndTime?: string;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  requiredSkillId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  headcountNeeded?: number;
}
