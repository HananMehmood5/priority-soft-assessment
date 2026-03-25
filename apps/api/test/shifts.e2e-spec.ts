import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';
import { DateTime } from 'luxon';

describe('Shifts (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;
  let adminToken: string;
  let locationId: string;
  let requiredSkillId: string;
  let otherSkillId: string;
  let locationTimezone: string;

  beforeAll(async () => {
    const { app: a } = await setupTestApp();
    app = a;

    const loginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'manager1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    managerToken = loginRes.body.data?.login;
    expect(managerToken).toBeTruthy();

    const adminLoginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'admin@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    adminToken = adminLoginRes.body.data?.login;
    expect(adminToken).toBeTruthy();

    const locRes = await graphqlRequest(
      app,
      { query: `query Locations { locations { id timezone } }` },
      managerToken,
    ).expect(200);
    locationId = locRes.body.data?.locations?.[0]?.id;
    expect(locationId).toBeTruthy();
    locationTimezone = locRes.body.data?.locations?.[0]?.timezone;
    expect(locationTimezone).toBeTruthy();

    const skillsRes = await graphqlRequest(
      app,
      { query: `query Skills { skills { id name } }` },
      managerToken,
    ).expect(200);
    const server = skillsRes.body.data?.skills?.find((s: any) => s.name === 'server');
    requiredSkillId = server?.id ?? skillsRes.body.data?.skills?.[0]?.id;
    const other = skillsRes.body.data?.skills?.find((s: any) => s.id !== requiredSkillId);
    otherSkillId = other?.id ?? skillsRes.body.data?.skills?.[0]?.id;
    expect(requiredSkillId).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  test('query shifts as manager returns array', async () => {
    const res = await graphqlRequest(
      app,
      {
        query: `query Shifts { shifts { id locationId startDate endDate daysOfWeek dailyStartTime dailyEndTime published } }`,
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.shifts).toBeDefined();
    expect(Array.isArray(res.body.data.shifts)).toBe(true);
  });

  test('createShift as manager returns shift', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const endDate = startDate;

    const res = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) {
          createShift(input: $input) { id locationId startDate endDate daysOfWeek dailyStartTime dailyEndTime published }
        }`,
        variables: {
          input: {
            locationId,
            startDate,
            endDate,
            daysOfWeek: [1, 2, 3, 4, 5],
            dailyStartTime: '09:00',
            dailyEndTime: '17:00',
            requiredSkillId,
            headcountNeeded: 1,
          },
        },
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.createShift).toBeDefined();
    expect(res.body.data.createShift.locationId).toBe(locationId);
    expect(res.body.data.createShift.published).toBe(false);
  });

  test('unpublishShift as manager succeeds before cutoff', async () => {
    const startDate = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const endDate = startDate;
    const res = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) {
          createShift(input: $input) { id published }
        }`,
        variables: {
          input: {
            locationId,
            startDate,
            endDate,
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            dailyStartTime: '09:00',
            dailyEndTime: '17:00',
            requiredSkillId,
            headcountNeeded: 1,
          },
        },
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    const shiftId = res.body.data?.createShift?.id;
    expect(shiftId).toBeTruthy();

    await graphqlRequest(
      app,
      { query: `mutation PublishShift($shiftId: String!) { publishShift(shiftId: $shiftId) { id published } }`, variables: { shiftId } },
      managerToken,
    ).expect(200);

    const unpubRes = await graphqlRequest(
      app,
      { query: `mutation UnpublishShift($shiftId: String!) { unpublishShift(shiftId: $shiftId) { id published } }`, variables: { shiftId } },
      managerToken,
    ).expect(200);

    expect(unpubRes.body.errors).toBeUndefined();
    expect(unpubRes.body.data?.unpublishShift?.published).toBe(false);
  });

  test('unpublishShift as manager fails after cutoff', async () => {
    const startDate = new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const endDate = startDate;
    const res = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) {
          createShift(input: $input) { id published }
        }`,
        variables: {
          input: {
            locationId,
            startDate,
            endDate,
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            dailyStartTime: '09:00',
            dailyEndTime: '17:00',
            requiredSkillId,
            headcountNeeded: 1,
          },
        },
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    const shiftId = res.body.data?.createShift?.id;
    expect(shiftId).toBeTruthy();

    await graphqlRequest(
      app,
      { query: `mutation PublishShift($shiftId: String!) { publishShift(shiftId: $shiftId) { id published } }`, variables: { shiftId } },
      managerToken,
    ).expect(200);

    const unpubRes = await graphqlRequest(
      app,
      { query: `mutation UnpublishShift($shiftId: String!) { unpublishShift(shiftId: $shiftId) { id published } }`, variables: { shiftId } },
      managerToken,
    ).expect(200);

    expect(unpubRes.body.errors).toBeDefined();
    const errorsText = JSON.stringify(unpubRes.body.errors);
    expect(errorsText).toContain('Cannot unpublish shift after cutoff');
  });

  test('query shifts without token returns unauthorized', async () => {
    const res = await graphqlRequest(app, {
      query: `query Shifts { shifts { id } }`,
    }).expect(200);
    expect(res.body.errors).toBeDefined();
  });

  test('onDutyShifts for manager2 does not return shifts outside managed locations', async () => {
    const mgr2Login = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'manager2@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const mgr2Token = mgr2Login.body.data?.login;
    expect(mgr2Token).toBeTruthy();

    const createRes = await graphqlRequest(
      app,
      {
        query: `mutation CreateLocation($input: CreateLocationInput!) {
          createLocation(input: $input) { id }
        }`,
        variables: {
          input: {
            name: `Scope-Test-${Date.now()}`,
            timezone: 'America/New_York',
          },
        },
      },
      adminToken,
    ).expect(200);
    const unmanagedLocationId = createRes.body.data?.createLocation?.id;
    expect(unmanagedLocationId).toBeTruthy();

    const res = await graphqlRequest(
      app,
      {
        query: `query O($locationId: String) {
          onDutyShifts(locationId: $locationId) { id locationId }
        }`,
        variables: { locationId: unmanagedLocationId },
      },
      mgr2Token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    const rows = res.body.data?.onDutyShifts ?? [];
    expect(rows.length).toBe(0);
  });

  test('createShift validates DTO inputs', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const endDate = startDate;
    const res = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) {
          createShift(input: $input) { id }
        }`,
        variables: {
          input: {
            locationId: 'not-a-uuid',
            startDate,
            endDate,
            daysOfWeek: [7],
            dailyStartTime: '09:00',
            dailyEndTime: '17:00',
            requiredSkillId,
            headcountNeeded: 1,
          },
        },
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeDefined();
    const errorsText = JSON.stringify(res.body.errors);
    expect(errorsText).toContain('Validation failed');
  });

  test('shift requiredSkillId is enforced on addAssignment', async () => {
    const monday = (() => {
      const dt = DateTime.now().setZone(locationTimezone).plus({ days: 14 });
      const targetWeekday = 1; // Monday
      const diff = (targetWeekday - dt.weekday + 7) % 7;
      return diff === 0 ? dt.plus({ days: 7 }).toISODate() : dt.plus({ days: diff }).toISODate();
    })();
    expect(monday).toBeTruthy();

    const createRes = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) {
          createShift(input: $input) { id }
        }`,
        variables: {
          input: {
            locationId,
            startDate: monday,
            endDate: monday,
            daysOfWeek: [1],
            dailyStartTime: '09:00',
            dailyEndTime: '17:00',
            requiredSkillId,
            headcountNeeded: 1,
          },
        },
      },
      managerToken,
    ).expect(200);

    const shiftId = createRes.body.data?.createShift?.id as string | undefined;
    expect(shiftId).toBeTruthy();

    const staffRes = await graphqlRequest(
      app,
      {
        query: `query Staff($locationId: String!) {
          staff(locationId: $locationId, role: Staff) { id }
        }`,
        variables: { locationId },
      },
      managerToken,
    ).expect(200);

    const wrongUserId = staffRes.body.data?.staff?.[0]?.id as string | undefined;
    expect(wrongUserId).toBeTruthy();

    const addRes = await graphqlRequest(
      app,
      {
        query: `mutation AddAssignment($shiftId: String!, $input: AddAssignmentInput!) {
          addAssignment(shiftId: $shiftId, input: $input) {
            assignment { id }
            constraintError { message }
          }
        }`,
        variables: {
          shiftId,
          input: {
            userId: wrongUserId,
            skillId: otherSkillId,
            overtimeOverrideReason: null,
          },
        },
      },
      managerToken,
    ).expect(200);

    const msg = addRes.body.data?.addAssignment?.constraintError?.message as string | undefined;
    expect(msg).toBeTruthy();
    expect(msg!.toLowerCase()).toContain('different skill');
  });

  test('shift headcountNeeded caps addAssignment', async () => {
    const monday = (() => {
      const dt = DateTime.now().setZone(locationTimezone).plus({ days: 21 });
      const targetWeekday = 1; // Monday
      const diff = (targetWeekday - dt.weekday + 7) % 7;
      return diff === 0 ? dt.plus({ days: 7 }).toISODate() : dt.plus({ days: diff }).toISODate();
    })();
    expect(monday).toBeTruthy();

    const createRes = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) {
          createShift(input: $input) { id }
        }`,
        variables: {
          input: {
            locationId,
            startDate: monday,
            endDate: monday,
            daysOfWeek: [1],
            dailyStartTime: '09:00',
            dailyEndTime: '17:00',
            requiredSkillId,
            headcountNeeded: 1,
          },
        },
      },
      managerToken,
    ).expect(200);

    const shiftId = createRes.body.data?.createShift?.id as string | undefined;
    expect(shiftId).toBeTruthy();

    const staffRes = await graphqlRequest(
      app,
      {
        query: `query Staff($locationId: String!, $skillId: String!) {
          staff(locationId: $locationId, role: Staff, skillId: $skillId) { id }
        }`,
        variables: { locationId, skillId: requiredSkillId },
      },
      managerToken,
    ).expect(200);

    const candidates = (staffRes.body.data?.staff ?? [])
      .map((s: any) => s.id)
      .filter((id: string) => !!id);

    let firstUserId: string | null = null;
    for (const uid of candidates) {
      const addRes = await graphqlRequest(
        app,
        {
          query: `mutation AddAssignment($shiftId: String!, $input: AddAssignmentInput!) {
            addAssignment(shiftId: $shiftId, input: $input) {
              assignment { id }
              constraintError { message }
            }
          }`,
          variables: {
            shiftId,
            input: { userId: uid, skillId: requiredSkillId, overtimeOverrideReason: null },
          },
        },
        managerToken,
      ).expect(200);

      const assignmentId = addRes.body.data?.addAssignment?.assignment?.id as string | undefined;
      if (assignmentId) {
        firstUserId = uid;
        break;
      }
    }
    expect(firstUserId).toBeTruthy();

    // Second assignment should fail due to headcount cap regardless of other eligibility checks.
    const allStaffRes = await graphqlRequest(
      app,
      {
        query: `query Staff($locationId: String!) {
          staff(locationId: $locationId, role: Staff) { id }
        }`,
        variables: { locationId },
      },
      managerToken,
    ).expect(200);

    const allStaffIds = (allStaffRes.body.data?.staff ?? []).map((s: any) => s.id).filter((id: string) => !!id);
    const secondUserId = allStaffIds.find((id: string) => id !== firstUserId);
    expect(secondUserId).toBeTruthy();

    const addRes = await graphqlRequest(
      app,
      {
        query: `mutation AddAssignment($shiftId: String!, $input: AddAssignmentInput!) {
          addAssignment(shiftId: $shiftId, input: $input) {
            assignment { id }
            constraintError { message }
          }
        }`,
        variables: {
          shiftId,
          input: { userId: secondUserId, skillId: requiredSkillId, overtimeOverrideReason: null },
        },
      },
      managerToken,
    ).expect(200);

    const msg = addRes.body.data?.addAssignment?.constraintError?.message as string | undefined;
    expect(msg).toBeTruthy();
    expect(msg!.toLowerCase()).toContain('headcount');
  });

  /** Duplicate (shiftId, userId) rows are rejected explicitly so double-booking the same template cannot slip through. */
  test('same staff cannot be assigned twice to the same shift (duplicate guard)', async () => {
    const workday = (() => {
      const dt = DateTime.now().setZone(locationTimezone).plus({ days: 28 });
      const targetWeekday = 3;
      const diff = (targetWeekday - dt.weekday + 7) % 7;
      return diff === 0 ? dt.plus({ days: 7 }).toISODate() : dt.plus({ days: diff }).toISODate();
    })();
    expect(workday).toBeTruthy();

    const skillStaffRes = await graphqlRequest(
      app,
      {
        query: `query Staff($locationId: String!, $skillId: String!) {
          staff(locationId: $locationId, role: Staff, skillId: $skillId) { id }
        }`,
        variables: { locationId, skillId: requiredSkillId },
      },
      managerToken,
    ).expect(200);
    const candidates = (skillStaffRes.body.data?.staff ?? []).map((u: { id: string }) => u.id);

    const luxonWeekday = DateTime.fromISO(workday!, { zone: locationTimezone }).weekday;
    const appDayOfWeek = luxonWeekday === 7 ? 0 : luxonWeekday;

    const createShift = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) { createShift(input: $input) { id } }`,
        variables: {
          input: {
            locationId,
            startDate: workday,
            endDate: workday,
            daysOfWeek: [appDayOfWeek],
            dailyStartTime: '10:00',
            dailyEndTime: '12:00',
            requiredSkillId,
            headcountNeeded: 2,
          },
        },
      },
      managerToken,
    ).expect(200);
    const shiftId = createShift.body.data?.createShift?.id as string | undefined;
    expect(createShift.body.errors).toBeUndefined();
    expect(shiftId).toBeTruthy();

    const addMutation = `mutation AddAssignment($shiftId: String!, $input: AddAssignmentInput!) {
      addAssignment(shiftId: $shiftId, input: $input) {
        assignment { id }
        constraintError { message }
      }
    }`;

    let staffUserId: string | null = null;
    for (const uid of candidates) {
      const tryFirst = await graphqlRequest(
        app,
        {
          query: addMutation,
          variables: {
            shiftId,
            input: { userId: uid, skillId: requiredSkillId, overtimeOverrideReason: null },
          },
        },
        managerToken,
      ).expect(200);
      if (tryFirst.body.data?.addAssignment?.assignment?.id) {
        staffUserId = uid;
        break;
      }
    }
    expect(staffUserId).toBeTruthy();

    const second = await graphqlRequest(
      app,
      {
        query: addMutation,
        variables: {
          shiftId,
          input: { userId: staffUserId!, skillId: requiredSkillId, overtimeOverrideReason: null },
        },
      },
      managerToken,
    ).expect(200);
    const msg = second.body.data?.addAssignment?.constraintError?.message as string | undefined;
    expect(second.body.errors).toBeUndefined();
    expect(msg).toBeTruthy();
    expect(msg!.toLowerCase()).toContain('already assigned');
  });

  /**
   * Same staff, same shift, two concurrent requests: user-row lock serializes;
   * the second hits the duplicate (shiftId, userId) guard after the first commits.
   */
  test('concurrent duplicate addAssignment same shift same user: exactly one succeeds', async () => {
    const workday = (() => {
      const dt = DateTime.now().setZone(locationTimezone).plus({ days: 35 });
      const targetWeekday = 4;
      const diff = (targetWeekday - dt.weekday + 7) % 7;
      return diff === 0 ? dt.plus({ days: 7 }).toISODate() : dt.plus({ days: diff }).toISODate();
    })();
    expect(workday).toBeTruthy();

    const luxonWeekday = DateTime.fromISO(workday!, { zone: locationTimezone }).weekday;
    const appDayOfWeek = luxonWeekday === 7 ? 0 : luxonWeekday;

    const createShift = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) { createShift(input: $input) { id } }`,
        variables: {
          input: {
            locationId,
            startDate: workday,
            endDate: workday,
            daysOfWeek: [appDayOfWeek],
            dailyStartTime: '14:00',
            dailyEndTime: '16:00',
            requiredSkillId,
            headcountNeeded: 1,
          },
        },
      },
      managerToken,
    ).expect(200);
    const shiftId = createShift.body.data?.createShift?.id as string | undefined;
    expect(createShift.body.errors).toBeUndefined();
    expect(shiftId).toBeTruthy();

    const skilledRes = await graphqlRequest(
      app,
      {
        query: `query Staff($locationId: String!, $skillId: String!) {
          staff(locationId: $locationId, role: Staff, skillId: $skillId) { id }
        }`,
        variables: { locationId, skillId: requiredSkillId },
      },
      managerToken,
    ).expect(200);
    const staffUserId = skilledRes.body.data?.staff?.[0]?.id as string | undefined;
    expect(staffUserId).toBeTruthy();

    const addMutation = `mutation AddAssignment($shiftId: String!, $input: AddAssignmentInput!) {
      addAssignment(shiftId: $shiftId, input: $input) {
        assignment { id }
        constraintError { message }
      }
    }`;

    const [resA, resB] = await Promise.all([
      graphqlRequest(
        app,
        {
          query: addMutation,
          variables: {
            shiftId,
            input: { userId: staffUserId, skillId: requiredSkillId, overtimeOverrideReason: null },
          },
        },
        managerToken,
      ),
      graphqlRequest(
        app,
        {
          query: addMutation,
          variables: {
            shiftId,
            input: { userId: staffUserId, skillId: requiredSkillId, overtimeOverrideReason: null },
          },
        },
        managerToken,
      ),
    ]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    const aOk = !!resA.body.data?.addAssignment?.assignment?.id;
    const bOk = !!resB.body.data?.addAssignment?.assignment?.id;
    const aErr = resA.body.data?.addAssignment?.constraintError?.message as string | undefined;
    const bErr = resB.body.data?.addAssignment?.constraintError?.message as string | undefined;

    expect(aOk && bOk).toBe(false);
    expect(!!aOk !== !!bOk).toBe(true);
    const failMsg = (aErr ?? bErr ?? '').toLowerCase();
    expect(failMsg).toContain('already assigned');
  });
});
