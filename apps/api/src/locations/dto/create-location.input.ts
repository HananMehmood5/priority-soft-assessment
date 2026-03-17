import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';

// Local list of supported timezones for locations.
// Kept intentionally local so API does not depend on rebuilding shared packages.
const SUPPORTED_TIMEZONES: readonly string[] = [
  'America/Los_Angeles',
  'America/New_York',
];

@InputType()
export class CreateLocationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @IsIn(SUPPORTED_TIMEZONES)
  timezone: string;
}
