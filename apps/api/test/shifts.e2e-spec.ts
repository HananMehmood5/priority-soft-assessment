import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Shifts (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;
  let locationId: string;

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

    const locRes = await graphqlRequest(
      app,
      { query: `query Locations { locations { id } }` },
      managerToken,
    ).expect(200);
    locationId = locRes.body.data?.locations?.[0]?.id;
    expect(locationId).toBeTruthy();
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

  test('query shifts without token returns unauthorized', async () => {
    const res = await graphqlRequest(app, {
      query: `query Shifts { shifts { id } }`,
    }).expect(200);
    expect(res.body.errors).toBeDefined();
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
          },
        },
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeDefined();
    const errorsText = JSON.stringify(res.body.errors);
    expect(errorsText).toContain('Validation failed');
    expect(errorsText).toContain('locationId');
  });
});
