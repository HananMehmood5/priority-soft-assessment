import type { Id } from '../common';
import type { ModelAttributes } from '../common';
import type { RequestStatus, RequestType } from '../enums';
import type { ShiftAssignmentAttributes } from './shift-assignment.types';
import type { UserLiteAttributes } from '../lite';

export interface ShiftRequestBaseAttributes {
  type: RequestType;
  assignmentId: Id;
  counterpartAssignmentId: Id | null;
  claimerUserId: Id | null;
  status?: RequestStatus;
}

export interface ShiftRequestBaseAttributesWithId
  extends ShiftRequestBaseAttributes {
  id: Id;
}

export interface ShiftRequestAttributes
  extends ShiftRequestBaseAttributes,
    ModelAttributes {
  assignment?: ShiftAssignmentAttributes;
  counterpartAssignment?: ShiftAssignmentAttributes | null;
  claimer?: UserLiteAttributes | null;
}
