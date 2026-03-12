import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@shiftsync/shared';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @Field(() => String)
  @IsEnum(UserRole)
  role: UserRole;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;
}
