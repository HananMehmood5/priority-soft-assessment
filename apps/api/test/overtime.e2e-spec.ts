import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Overtime (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;

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

    const assignmentStart = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    assignmentStart.setHours(9, 0, 0, 0);
    const assignmentEnd = new Date(assignmentStart.getTime() + 8 * 3600 * 1000);

    const res = await graphqlRequest(
      app,
      {
        query: `query OvertimeWhatIf($userId: String!, $assignmentStart: DateTime!, $assignmentEnd: DateTime!) {
          overtimeWhatIf(userId: $userId, assignmentStart: $assignmentStart, assignmentEnd: $assignmentEnd) {
            canAssign projectedWeeklyHours weeklyWarn weeklyBlock
          }
        }`,
        variables: {
          userId: uid,
          assignmentStart: assignmentStart.toISOString(),
          assignmentEnd: assignmentEnd.toISOString(),
        },
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.overtimeWhatIf).toBeDefined();
    expect(typeof res.body.data.overtimeWhatIf.canAssign).toBe('boolean');
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
