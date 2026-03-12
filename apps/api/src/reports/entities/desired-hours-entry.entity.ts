import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';

export enum DesiredHoursStatus {
  Under = 'under',
  Over = 'over',
  Ok = 'ok',
}

registerEnumType(DesiredHoursStatus, { name: 'DesiredHoursStatus' });

@ObjectType()
export class DesiredHoursEntryEntity {
  @Field()
  userId: string;

  @Field(() => String, { nullable: true })
  userName: string | null;

  @Field()
  desiredWeeklyHours: number;

  @Field()
  actualHours: number;

  @Field(() => DesiredHoursStatus)
  status: DesiredHoursStatus;

  @Field()
  difference: number;
}
