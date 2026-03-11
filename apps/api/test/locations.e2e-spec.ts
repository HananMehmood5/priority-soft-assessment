import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Locations (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: a } = await setupTestApp();
    app = a;
  });

  afterAll(async () => {
    await app.close();
  });

  test('query locations with manager token returns array', async () => {
    const loginRes = await graphqlRequest(app, {
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input)
        }
      `,
      variables: {
        input: { email: 'manager1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);

    const token = loginRes.body.data?.login;
    expect(token).toBeTruthy();

    const res = await graphqlRequest(
      app,
      {
        query: `
          query Locations {
            locations {
              id
              name
              timezone
            }
          }
        `,
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.locations).toBeDefined();
    expect(Array.isArray(res.body.data.locations)).toBe(true);
    expect(res.body.data.locations.length).toBeGreaterThan(0);
    expect(res.body.data.locations[0]).toHaveProperty('id');
    expect(res.body.data.locations[0]).toHaveProperty('name');
    expect(res.body.data.locations[0]).toHaveProperty('timezone');
  });

  test('query locations without token returns unauthorized or empty', async () => {
    const res = await graphqlRequest(app, {
      query: `
        query Locations {
          locations {
            id
            name
          }
        }
      `,
    }).expect(200);

    expect(res.body.errors).toBeDefined();
    expect(res.body.data?.locations).toBeUndefined();
  });
});
