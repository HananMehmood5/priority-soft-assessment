import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Notifications (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: a } = await setupTestApp();
    app = a;
  });

  afterAll(async () => {
    await app.close();
  });

  test('notifications query with token returns array', async () => {
    const loginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'staff1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const token = loginRes.body.data?.login;
    expect(token).toBeTruthy();

    const res = await graphqlRequest(
      app,
      {
        query: `query Notifications { notifications { id type title read } }`,
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.notifications).toBeDefined();
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
  });

  test('notificationPreferences query returns array', async () => {
    const loginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'staff1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const token = loginRes.body.data?.login;

    const res = await graphqlRequest(
      app,
      {
        query: `query NotificationPreferences { notificationPreferences { id channel enabled } }`,
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.notificationPreferences).toBeDefined();
    expect(Array.isArray(res.body.data.notificationPreferences)).toBe(true);
  });
});
