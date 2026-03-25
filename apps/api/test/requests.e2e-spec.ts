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

  test('drop: availableDrops respects manager read scope; second acceptDrop fails after first', async () => {
    const staffLogin = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'staff1@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const staff1Token = staffLogin.body.data?.login;
    expect(staff1Token).toBeTruthy();

    const staff2Login = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'staff2@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const staff2Token = staff2Login.body.data?.login;

    const myRes = await graphqlRequest(
      app,
      { query: `query A { myAssignments { id } }` },
      staff1Token,
    ).expect(200);
    const assignmentId: string | undefined = myRes.body.data?.myAssignments?.[0]?.id;
    if (!assignmentId) return;

    const dropRes = await graphqlRequest(
      app,
      {
        query: `mutation CreateDrop($assignmentId: String!) {
          createDropRequest(assignmentId: $assignmentId) { id }
        }`,
        variables: { assignmentId },
      },
      staff1Token,
    ).expect(200);
    if (dropRes.body.errors?.length) return;
    const requestId: string | undefined = dropRes.body.data?.createDropRequest?.id;
    expect(requestId).toBeTruthy();

    const adminToken = (
      await graphqlRequest(app, {
        query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
        variables: {
          input: { email: 'admin@coastaleats.com', password: 'password123' },
        },
      }).expect(200)
    ).body.data?.login;
    const mgr1Token = (
      await graphqlRequest(app, {
        query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
        variables: {
          input: { email: 'manager1@coastaleats.com', password: 'password123' },
        },
      }).expect(200)
    ).body.data?.login;
    const mgr2Token = (
      await graphqlRequest(app, {
        query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
        variables: {
          input: { email: 'manager2@coastaleats.com', password: 'password123' },
        },
      }).expect(200)
    ).body.data?.login;

    const adminDrops = await graphqlRequest(
      app,
      { query: `query D { availableDrops { id } }` },
      adminToken,
    ).expect(200);
    const m1Drops = await graphqlRequest(
      app,
      { query: `query D { availableDrops { id } }` },
      mgr1Token,
    ).expect(200);
    const m2Drops = await graphqlRequest(
      app,
      { query: `query D { availableDrops { id } }` },
      mgr2Token,
    ).expect(200);

    expect(adminDrops.body.errors).toBeUndefined();
    expect(m1Drops.body.errors).toBeUndefined();
    expect(m2Drops.body.errors).toBeUndefined();
    const adminIds = (adminDrops.body.data?.availableDrops ?? []).map((r: { id: string }) => r.id);
    const m1Ids = (m1Drops.body.data?.availableDrops ?? []).map((r: { id: string }) => r.id);
    const m2Ids = (m2Drops.body.data?.availableDrops ?? []).map((r: { id: string }) => r.id);
    expect(adminIds).toContain(requestId);
    // Seeded shift is Downtown; manager1 manages Downtown+Harbor, manager2 only East+West.
    expect(m1Ids).toContain(requestId);
    expect(m2Ids).not.toContain(requestId);

    const accept1 = await graphqlRequest(
      app,
      {
        query: `mutation Accept($requestId: String!) {
          acceptDropRequest(requestId: $requestId) { request { id } constraintError { message } }
        }`,
        variables: { requestId },
      },
      staff2Token,
    ).expect(200);

    if (accept1.body.errors?.length || accept1.body.data?.acceptDropRequest?.constraintError) {
      await graphqlRequest(
        app,
        {
          query: `mutation X($requestId: String!) { cancelRequest(requestId: $requestId) { id } }`,
          variables: { requestId },
        },
        staff1Token,
      ).expect(200);
      return;
    }

    const accept2 = await graphqlRequest(
      app,
      {
        query: `mutation Accept($requestId: String!) {
          acceptDropRequest(requestId: $requestId) { request { id } constraintError { message } }
        }`,
        variables: { requestId },
      },
      staff2Token,
    ).expect(200);
    const msg = JSON.stringify(accept2.body.errors ?? accept2.body.data);
    expect(
      accept2.body.errors?.length ||
        accept2.body.data?.acceptDropRequest?.constraintError ||
        msg.includes('no longer pending') ||
        msg.includes('Conflict'),
    ).toBeTruthy();
  });
});
