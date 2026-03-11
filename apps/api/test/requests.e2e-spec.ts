import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Requests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: a } = await setupTestApp();
    app = a;
  });

  afterAll(async () => {
    await app.close();
  });

  test('myRequests as staff returns array', async () => {
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
        query: `query MyRequests { myRequests { id type status } }`,
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.myRequests).toBeDefined();
    expect(Array.isArray(res.body.data.myRequests)).toBe(true);
  });

  test('pendingRequests as manager returns array', async () => {
    const loginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'manager1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const token = loginRes.body.data?.login;
    expect(token).toBeTruthy();

    const res = await graphqlRequest(
      app,
      {
        query: `query PendingRequests { pendingRequests { id type status } }`,
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.pendingRequests).toBeDefined();
    expect(Array.isArray(res.body.data.pendingRequests)).toBe(true);
  });

  test('createSwapRequest with invalid assignmentId returns error', async () => {
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
        query: `mutation CreateSwap($assignmentId: String!) {
          createSwapRequest(assignmentId: $assignmentId) { id }
        }`,
        variables: { assignmentId: '00000000-0000-0000-0000-000000000000' },
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeDefined();
  });
});
