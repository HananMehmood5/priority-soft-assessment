import type { ShiftAttributes } from '@shiftsync/shared';
import type { Shift } from '../../database/models';

export function toShiftAttributes(shift: Shift): ShiftAttributes {
  const json = shift.toJSON() as unknown as {
    id: string;
    locationId: string;
    startDate: Date;
    endDate: Date;
    daysOfWeek: number[];
    dailyStartTime: string;
    dailyEndTime: string;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  return {
    id: json.id,
    locationId: json.locationId,
    startDate: json.startDate.toISOString().slice(0, 10),
    endDate: json.endDate.toISOString().slice(0, 10),
    daysOfWeek: json.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
    dailyStartTime: json.dailyStartTime,
    dailyEndTime: json.dailyEndTime,
    published: json.published,
    createdAt: json.createdAt.toISOString(),
    updatedAt: json.updatedAt.toISOString(),
  };
}

