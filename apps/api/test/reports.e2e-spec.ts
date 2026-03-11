import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;

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
      managerToken,
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
      managerToken,
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
      managerToken,
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
});
