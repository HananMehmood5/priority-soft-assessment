import { gql } from '@apollo/client';

// Auth
export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      role
      name
      createdAt
      updatedAt
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input)
  }
`;

// Profile
export const ME_PROFILE_QUERY = gql`
  query MeProfile {
    me {
      id
      name
      desiredHours {
        weeklyHours
        createdAt
      }
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      id
      name
      desiredHours {
        weeklyHours
        createdAt
      }
    }
  }
`;

// Locations
export const LOCATIONS_QUERY = gql`
  query Locations {
    locations {
      id
      name
      timezone
    }
  }
`;

// Shifts
export const SHIFTS_WITH_LOCATIONS_QUERY = gql`
  query ShiftsWithLocations {
    shifts {
      id
      locationId
      startAt
      endAt
      published
    }
    locations {
      id
      name
      timezone
    }
  }
`;

export const SHIFT_QUERY = gql`
  query Shift($id: String!) {
    shift(id: $id) {
      id
      locationId
      startAt
      endAt
      published
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SHIFT_MUTATION = gql`
  mutation CreateShift($input: CreateShiftInput!) {
    createShift(input: $input) {
      id
      locationId
      startAt
      endAt
      published
    }
  }
`;

export const ADD_ASSIGNMENT_MUTATION = gql`
  mutation AddAssignment($shiftId: String!, $input: AddAssignmentInput!) {
    addAssignment(shiftId: $shiftId, input: $input) {
      assignment {
        id
        shiftId
        userId
        skillId
        version
        createdAt
        updatedAt
      }
      constraintError {
        message
        alternatives {
          id
          name
        }
      }
    }
  }
`;

export const SHIFT_HISTORY_QUERY = gql`
  query ShiftHistory($shiftId: String!) {
    shiftHistory(shiftId: $shiftId) {
      id
      userId
      entityId
      entityType
      action
      createdAt
      before
      after
    }
  }
`;

export const OVERTIME_WHAT_IF_QUERY = gql`
  query OvertimeWhatIf(
    $userId: String!
    $assignmentStart: Date!
    $assignmentEnd: Date!
  ) {
    overtimeWhatIf(
      userId: $userId
      assignmentStart: $assignmentStart
      assignmentEnd: $assignmentEnd
    ) {
      projectedWeeklyHours
      projectedDailyHours
      weeklyWarn
      weeklyBlock
      dailyWarn
      dailyBlock
      consecutiveDays
      consecutiveWarn
      consecutiveRequireOverride
      canAssign
      message
    }
  }
`;

// Skills
export const SKILLS_QUERY = gql`
  query Skills {
    skills {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

export const SKILLS_QUERY_MINIMAL = gql`
  query SkillsMinimal {
    skills {
      id
      name
    }
  }
`;

// Requests
export const MY_REQUESTS_QUERY = gql`
  query MyRequests {
    myRequests {
      id
      type
      assignmentId
      counterpartAssignmentId
      claimerUserId
      status
      createdAt
      updatedAt
    }
  }
`;

export const CANCEL_MUTATION = gql`
  mutation CancelRequest($requestId: String!) {
    cancelRequest(requestId: $requestId) {
      id
      status
    }
  }
`;

export const PENDING_REQUESTS_QUERY = gql`
  query PendingRequests {
    pendingRequests {
      id
      type
      assignmentId
      counterpartAssignmentId
      claimerUserId
      status
      createdAt
      updatedAt
    }
  }
`;

export const APPROVE_MUTATION = gql`
  mutation ApproveRequest($requestId: String!) {
    approveRequest(requestId: $requestId) {
      id
      status
    }
  }
`;

export const REJECT_MUTATION = gql`
  mutation RejectRequest($requestId: String!) {
    rejectRequest(requestId: $requestId) {
      id
      status
    }
  }
`;

// Swaps
export const AVAILABLE_SWAPS_QUERY = gql`
  query AvailableSwaps {
    availableSwaps {
      id
      type
      assignmentId
      status
      createdAt
      assignment {
        id
        shiftId
        shift {
          id
          locationId
          startAt
          endAt
        }
      }
    }
  }
`;

export const MY_ASSIGNMENTS_QUERY = gql`
  query MyAssignments {
    myAssignments {
      id
      shiftId
      userId
      skillId
      version
      createdAt
      updatedAt
      shift {
        id
        locationId
        startAt
        endAt
        published
      }
    }
  }
`;

export const ACCEPT_SWAP_MUTATION = gql`
  mutation AcceptSwapRequest(
    $requestId: String!
    $counterpartAssignmentId: String!
  ) {
    acceptSwapRequest(
      requestId: $requestId
      counterpartAssignmentId: $counterpartAssignmentId
    ) {
      request {
        id
        status
      }
      constraintError {
        message
        alternatives {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_SWAP_MUTATION = gql`
  mutation CreateSwapRequest($assignmentId: String!) {
    createSwapRequest(assignmentId: $assignmentId) {
      id
      type
      status
    }
  }
`;

// Drops
export const AVAILABLE_DROPS_QUERY = gql`
  query AvailableDrops {
    availableDrops {
      id
      type
      assignmentId
      status
      createdAt
      assignment {
        id
        shiftId
        shift {
          id
          locationId
          startAt
          endAt
        }
      }
    }
  }
`;

export const ACCEPT_DROP_MUTATION = gql`
  mutation AcceptDropRequest($requestId: String!) {
    acceptDropRequest(requestId: $requestId) {
      request {
        id
        status
      }
      constraintError {
        message
        alternatives {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_DROP_MUTATION = gql`
  mutation CreateDropRequest($assignmentId: String!) {
    createDropRequest(assignmentId: $assignmentId) {
      id
      type
      status
    }
  }
`;

// Notifications
export const NOTIFICATIONS_QUERY = gql`
  query Notifications(
    $unreadOnly: Boolean
    $limit: Int
    $offset: Int
  ) {
    notifications(
      unreadOnly: $unreadOnly
      limit: $limit
      offset: $offset
    ) {
      id
      type
      title
      body
      read
      createdAt
    }
  }
`;

export const MARK_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id) {
      id
      read
    }
  }
`;

export const MARK_ALL_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

// Reports
export const AUDIT_EXPORT_QUERY = gql`
  query AuditExport($start: Date!, $end: Date!, $locationId: String) {
    auditExport(start: $start, end: $end, locationId: $locationId) {
      id
      userId
      entityId
      entityType
      action
      createdAt
      before
      after
    }
  }
`;

export const DISTRIBUTION_QUERY = gql`
  query Distribution(
    $start: Date!
    $end: Date!
    $locationId: String
  ) {
    reportDistribution(
      start: $start
      end: $end
      locationId: $locationId
    ) {
      userId
      userName
      totalHours
    }
  }
`;

export const PREMIUM_FAIRNESS_QUERY = gql`
  query PremiumFairness(
    $start: Date!
    $end: Date!
    $locationId: String
  ) {
    reportPremiumFairness(
      start: $start
      end: $end
      locationId: $locationId
    ) {
      userId
      userName
      premiumShiftCount
      totalShiftCount
      totalHours
      fairnessScore
    }
  }
`;

export const DESIRED_HOURS_QUERY = gql`
  query DesiredHours(
    $start: Date!
    $end: Date!
    $locationId: String
    $role: UserRole
  ) {
    reportDesiredHours(
      start: $start
      end: $end
      locationId: $locationId
      role: $role
    ) {
      userId
      userName
      desiredWeeklyHours
      actualHours
      status
      difference
    }
  }
`;

export const OVERTIME_DASHBOARD_QUERY = gql`
  query OvertimeDashboard(
    $start: Date!
    $end: Date!
    $locationId: String
  ) {
    overtimeDashboard(
      start: $start
      end: $end
      locationId: $locationId
    ) {
      userId
      userName
      weekStart
      weeklyHours
      overtimeHours
      assignments {
        shiftId
        startAt
        endAt
        hours
      }
    }
  }
`;

// On-duty
export const ON_DUTY_QUERY = gql`
  query OnDuty($locationId: String) {
    onDutyShifts(locationId: $locationId) {
      id
      locationId
      startAt
      endAt
      published
      assignments {
        id
        userId
        skillId
      }
    }
  }
`;
