import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;
  let staffToken: string;
  let adminToken: string;

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

    const staffLoginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'staff1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    staffToken = staffLoginRes.body.data?.login;
    expect(staffToken).toBeTruthy();

    const adminLoginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'admin@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    adminToken = adminLoginRes.body.data?.login;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  test('reportDistribution returns array', async () => {
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(
      app,
      {
        query: `query ReportDistribution($start: DateTime!, $end: DateTime!) {
          reportDistribution(start: $start, end: $end) { userId userName totalHours }
        }`,
        variables: { start, end },
      },
      adminToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.reportDistribution).toBeDefined();
    expect(Array.isArray(res.body.data.reportDistribution)).toBe(true);
  });

  test('reportPremiumFairness returns array', async () => {
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(
      app,
      {
        query: `query ReportPremiumFairness($start: DateTime!, $end: DateTime!) {
          reportPremiumFairness(start: $start, end: $end) { userId userName premiumShiftCount totalShiftCount fairnessScore }
        }`,
        variables: { start, end },
      },
      adminToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.reportPremiumFairness).toBeDefined();
    expect(Array.isArray(res.body.data.reportPremiumFairness)).toBe(true);
  });

  test('reportDesiredHours returns array', async () => {
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(
      app,
      {
        query: `query ReportDesiredHours($start: DateTime!, $end: DateTime!) {
          reportDesiredHours(start: $start, end: $end) { userId userName desiredWeeklyHours actualHours status }
        }`,
        variables: { start, end },
      },
      adminToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.reportDesiredHours).toBeDefined();
    expect(Array.isArray(res.body.data.reportDesiredHours)).toBe(true);
  });

  test('reports without token are forbidden', async () => {
    const start = new Date().toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(app, {
      query: `query ReportDistribution($start: DateTime!, $end: DateTime!) {
        reportDistribution(start: $start, end: $end) { userId }
      }`,
      variables: { start, end },
    }).expect(200);
    expect(res.body.errors).toBeDefined();
  });

  test('staff role is forbidden from reports', async () => {
    const start = new Date().toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(
      app,
      {
        query: `query ReportDistribution($start: DateTime!, $end: DateTime!) {
          reportDistribution(start: $start, end: $end) { userId }
        }`,
        variables: { start, end },
      },
      staffToken,
    ).expect(200);

    expect(res.body.errors).toBeDefined();
    expect(JSON.stringify(res.body.errors)).toContain('Forbidden');
  });

  test('manager cannot query reports for unmanaged location', async () => {
    const createRes = await graphqlRequest(
      app,
      {
        query: `mutation CreateLocation($input: CreateLocationInput!) {
          createLocation(input: $input) { id }
        }`,
        variables: {
          input: {
            name: `Unmanaged-${Date.now()}`,
            timezone: 'America/New_York',
          },
        },
      },
      adminToken,
    ).expect(200);
    const unmanagedLocationId = createRes.body.data?.createLocation?.id;
    expect(unmanagedLocationId).toBeTruthy();

    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const end = new Date().toISOString();
    const res = await graphqlRequest(
      app,
      {
        query: `query ReportDistribution($start: DateTime!, $end: DateTime!, $locationId: String) {
          reportDistribution(start: $start, end: $end, locationId: $locationId) { userId userName totalHours }
        }`,
        variables: { start, end, locationId: unmanagedLocationId },
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeDefined();
    expect(JSON.stringify(res.body.errors)).toContain('Forbidden');
  });
});
