import type { ShiftAttributes } from '@shiftsync/shared';
import type { Shift } from '../../database/models';

export function toShiftAttributes(shift: Shift): ShiftAttributes {
  const json = shift.toJSON() as unknown as {
    id: string;
    locationId: string;
    startAt: Date;
    endAt: Date;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  return {
    id: json.id,
    locationId: json.locationId,
    startAt: json.startAt.toISOString(),
    endAt: json.endAt.toISOString(),
    published: json.published,
    createdAt: json.createdAt.toISOString(),
    updatedAt: json.updatedAt.toISOString(),
  };
}

