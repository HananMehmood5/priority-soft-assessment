export type OvertimeWhatIf = {
  projectedWeeklyHours: number;
  projectedDailyHours: number;
  weeklyWarn: boolean;
  weeklyBlock: boolean;
  dailyWarn: boolean;
  dailyBlock: boolean;
  consecutiveDays: number;
  consecutiveWarn: boolean;
  consecutiveRequireOverride: boolean;
  canAssign: boolean;
  message?: string | null;
};

