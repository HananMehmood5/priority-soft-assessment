import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Overtime (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;
  let requiredSkillId: string;

  beforeAll(async () => {
    const { app: a } = await setupTestApp();
    app = a;

    const managerLogin = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'manager1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    managerToken = managerLogin.body.data?.login;

    const skillsRes = await graphqlRequest(
      app,
      { query: `query Skills { skills { id name } }` },
      managerToken,
    ).expect(200);
    const server = skillsRes.body.data?.skills?.find((s: any) => s.name === 'server');
    requiredSkillId = server?.id ?? skillsRes.body.data?.skills?.[0]?.id;
    expect(requiredSkillId).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  test('overtimeWhatIf returns result', async () => {
    const loginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'staff1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const token = loginRes.body.data?.login;
    const userRes = await graphqlRequest(
      app,
      { query: `query Me { me { id } }` },
      token,
    ).expect(200);
    const uid = userRes.body.data?.me?.id;
    expect(uid).toBeTruthy();

    const locRes = await graphqlRequest(
      app,
      { query: `query Locations { locations { id } }` },
      managerToken,
    ).expect(200);
    const locationId = locRes.body.data?.locations?.[0]?.id;
    expect(locationId).toBeTruthy();

    // Pick a week far enough in the future that the test user has no existing assignments.
    const base = new Date(Date.now() + 70 * 24 * 3600 * 1000);
    const day = base.getUTCDay(); // 0=Sun..6=Sat
    const diffToMon = (1 - day + 7) % 7;
    base.setUTCDate(base.getUTCDate() + diffToMon);
    base.setUTCHours(0, 0, 0, 0);

    const startDate = base.toISOString().slice(0, 10);
    const end = new Date(base);
    end.setUTCDate(end.getUTCDate() + 6); // Sunday
    const endDate = end.toISOString().slice(0, 10);

    const createShift = async (daysOfWeek: number[]) => {
      const res = await graphqlRequest(
        app,
        {
          query: `mutation CreateShift($input: CreateShiftInput!) {
            createShift(input: $input) { id }
          }`,
          variables: {
            input: {
              locationId,
              startDate,
              endDate,
              dailyStartTime: '09:00',
              dailyEndTime: '17:00',
              daysOfWeek,
              requiredSkillId,
              headcountNeeded: 1,
            },
          },
        },
        managerToken,
      ).expect(200);

      return res.body.data?.createShift?.id as string | undefined;
    };

    const shiftIdMonThu = await createShift([1, 2, 3, 4]); // Mon-Thu (4 days) => 32h
    const shiftIdMonFri = await createShift([1, 2, 3, 4, 5]); // Mon-Fri (5 days) => 40h (block)
    expect(shiftIdMonThu).toBeTruthy();
    expect(shiftIdMonFri).toBeTruthy();

    const resMonThu = await graphqlRequest(
      app,
      {
        query: `query OvertimeWhatIf($userId: String!, $shiftId: String!) {
          overtimeWhatIf(userId: $userId, shiftId: $shiftId) {
            canAssign
            projectedWeeklyHours
            projectedDailyHours
            weeklyBlock
          }
        }`,
        variables: { userId: uid, shiftId: shiftIdMonThu },
      },
      token,
    ).expect(200);

    expect(resMonThu.body.errors).toBeUndefined();
    expect(resMonThu.body.data?.overtimeWhatIf).toBeDefined();
    expect(resMonThu.body.data.overtimeWhatIf.canAssign).toBe(true);
    expect(resMonThu.body.data.overtimeWhatIf.projectedWeeklyHours).toBeLessThan(40);
    expect(resMonThu.body.data.overtimeWhatIf.projectedDailyHours).toBeCloseTo(8, 5);
    expect(resMonThu.body.data.overtimeWhatIf.weeklyBlock).toBe(false);

    const resMonFri = await graphqlRequest(
      app,
      {
        query: `query OvertimeWhatIf($userId: String!, $shiftId: String!) {
          overtimeWhatIf(userId: $userId, shiftId: $shiftId) {
            canAssign
            projectedWeeklyHours
            projectedDailyHours
            weeklyBlock
          }
        }`,
        variables: { userId: uid, shiftId: shiftIdMonFri },
      },
      token,
    ).expect(200);

    expect(resMonFri.body.errors).toBeUndefined();
    expect(resMonFri.body.data?.overtimeWhatIf).toBeDefined();
    expect(resMonFri.body.data.overtimeWhatIf.canAssign).toBe(false);
    expect(resMonFri.body.data.overtimeWhatIf.projectedWeeklyHours).toBeGreaterThanOrEqual(40);
    expect(resMonFri.body.data.overtimeWhatIf.projectedDailyHours).toBeCloseTo(8, 5);
    expect(resMonFri.body.data.overtimeWhatIf.weeklyBlock).toBe(true);
  });

  test('overtimeDashboard as manager returns array', async () => {
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(
      app,
      {
        query: `query OvertimeDashboard($start: DateTime!, $end: DateTime!) {
          overtimeDashboard(start: $start, end: $end) { userId userName weeklyHours overtimeHours }
        }`,
        variables: { start, end },
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.overtimeDashboard).toBeDefined();
    expect(Array.isArray(res.body.data.overtimeDashboard)).toBe(true);
  });
});
