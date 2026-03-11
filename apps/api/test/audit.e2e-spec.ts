import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Audit (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;
  let adminToken: string;
  let shiftId: string;

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

    const adminLogin = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'admin@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    adminToken = adminLogin.body.data?.login;

    const shiftsRes = await graphqlRequest(
      app,
      { query: `query Shifts { shifts { id } }` },
      managerToken,
    ).expect(200);
    shiftId = shiftsRes.body.data?.shifts?.[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('shiftHistory as manager returns array', async () => {
    if (!shiftId) return;
    const res = await graphqlRequest(
      app,
      {
        query: `query ShiftHistory($shiftId: String!) {
          shiftHistory(shiftId: $shiftId) { id action entityType entityId createdAt }
        }`,
        variables: { shiftId },
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.shiftHistory).toBeDefined();
    expect(Array.isArray(res.body.data.shiftHistory)).toBe(true);
  });

  test('auditExport as admin returns array', async () => {
    const start = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(
      app,
      {
        query: `query AuditExport($start: DateTime!, $end: DateTime!) {
          auditExport(start: $start, end: $end) { id action entityType createdAt }
        }`,
        variables: { start, end },
      },
      adminToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.auditExport).toBeDefined();
    expect(Array.isArray(res.body.data.auditExport)).toBe(true);
  });

  test('auditExport as manager is forbidden', async () => {
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(
      app,
      {
        query: `query AuditExport($start: DateTime!, $end: DateTime!) {
          auditExport(start: $start, end: $end) { id }
        }`,
        variables: { start, end },
      },
      managerToken,
    ).expect(200);
    expect(res.body.errors).toBeDefined();
  });
});
