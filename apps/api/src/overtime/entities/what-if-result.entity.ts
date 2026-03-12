import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class WhatIfResultEntity {
  @Field()
  projectedWeeklyHours: number;

  @Field()
  projectedDailyHours: number;

  @Field()
  weeklyWarn: boolean;

  @Field()
  weeklyBlock: boolean;

  @Field()
  dailyWarn: boolean;

  @Field()
  dailyBlock: boolean;

  @Field()
  consecutiveDays: number;

  @Field()
  consecutiveWarn: boolean;

  @Field()
  consecutiveRequireOverride: boolean;

  @Field()
  canAssign: boolean;

  @Field(() => String, { nullable: true })
  message?: string;
}
