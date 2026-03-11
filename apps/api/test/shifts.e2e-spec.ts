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
        query: `query Shifts { shifts { id locationId startAt endAt published } }`,
      },
      managerToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.shifts).toBeDefined();
    expect(Array.isArray(res.body.data.shifts)).toBe(true);
  });

  test('createShift as manager returns shift', async () => {
    const startAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    startAt.setHours(9, 0, 0, 0);
    const endAt = new Date(startAt.getTime() + 8 * 3600 * 1000);

    const res = await graphqlRequest(
      app,
      {
        query: `mutation CreateShift($input: CreateShiftInput!) {
          createShift(input: $input) { id locationId startAt endAt published }
        }`,
        variables: {
          input: {
            locationId,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
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
});
