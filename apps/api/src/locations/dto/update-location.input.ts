import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

// Local list of supported timezones for locations.
// Kept intentionally local so API does not depend on rebuilding shared packages.
const SUPPORTED_TIMEZONES: readonly string[] = [
  'America/Los_Angeles',
  'America/New_York',
];

@InputType()
export class UpdateLocationInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIn(SUPPORTED_TIMEZONES, {
    message: `timezone must be one of: ${SUPPORTED_TIMEZONES.join(', ')}`,
  })
  timezone?: string;
}
