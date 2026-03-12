import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class UpdateShiftInput {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startAt?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endAt?: Date;
}
