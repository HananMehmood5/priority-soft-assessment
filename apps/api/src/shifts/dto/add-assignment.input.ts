import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class AddAssignmentInput {
  @Field()
  @IsUUID()
  userId: string;

  @Field()
  @IsUUID()
  skillId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  overtimeOverrideReason?: string | null;
}
