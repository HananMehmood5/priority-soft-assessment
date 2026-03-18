import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

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
}
