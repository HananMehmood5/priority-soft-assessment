import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AssignmentHoursEntry {
  @Field()
  shiftId: string;

  @Field()
  startAt: Date;

  @Field()
  endAt: Date;

  @Field()
  hours: number;
}

@ObjectType()
export class DashboardOvertimeEntryEntity {
  @Field()
  userId: string;

  @Field({ nullable: true })
  userName: string | null;

  @Field()
  weekStart: string;

  @Field()
  weeklyHours: number;

  @Field()
  overtimeHours: number;

  @Field(() => [AssignmentHoursEntry])
  assignments: Array<{ shiftId: string; startAt: Date; endAt: Date; hours: number }>;
}
