import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Skills (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: a } = await setupTestApp();
    app = a;
  });

  afterAll(async () => {
    await app.close();
  });

  test('query skills with token returns array', async () => {
    const loginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'admin@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const token = loginRes.body.data?.login;
    expect(token).toBeTruthy();

    const res = await graphqlRequest(
      app,
      {
        query: `query Skills { skills { id name staffCount } }`,
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.skills).toBeDefined();
    expect(Array.isArray(res.body.data.skills)).toBe(true);
    expect(res.body.data.skills.length).toBeGreaterThan(0);
    expect(res.body.data.skills[0]).toHaveProperty('id');
    expect(res.body.data.skills[0]).toHaveProperty('name');
    expect(res.body.data.skills[0]).toHaveProperty('staffCount');
    expect(typeof res.body.data.skills[0].staffCount).toBe('number');

    const firstSkillId = res.body.data.skills[0].id;
    const staffRes = await graphqlRequest(
      app,
      {
        query: `
          query StaffBySkill($skillId: String!) {
            staff(role: Staff, skillId: $skillId) { id }
          }
        `,
        variables: { skillId: firstSkillId },
      },
      token,
    ).expect(200);

    expect(staffRes.body.errors).toBeUndefined();
    const staffForFirstSkill = staffRes.body.data?.staff ?? [];
    expect(staffForFirstSkill.length).toBe(res.body.data.skills[0].staffCount);
  });

  test('createSkill as Admin returns skill', async () => {
    const loginRes = await graphqlRequest(app, {
      query: `mutation Login($input: LoginInput!) { login(input: $input) }`,
      variables: {
        input: { email: 'admin@coastaleats.com', password: 'password123' },
      },
    }).expect(200);
    const token = loginRes.body.data?.login;
    expect(token).toBeTruthy();

    const name = `e2e-skill-${Date.now()}`;
    const res = await graphqlRequest(
      app,
      {
        query: `mutation CreateSkill($input: CreateSkillInput!) { createSkill(input: $input) { id name staffCount } }`,
        variables: { input: { name } },
      },
      token,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.createSkill).toBeDefined();
    expect(res.body.data.createSkill.name).toBe(name);
    expect(res.body.data.createSkill.staffCount).toBe(0);
  });

  test('query skills without token returns unauthorized', async () => {
    const res = await graphqlRequest(app, {
      query: `query Skills { skills { id name staffCount } }`,
    }).expect(200);
    expect(res.body.errors).toBeDefined();
  });
});
