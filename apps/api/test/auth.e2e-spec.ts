import { INestApplication } from '@nestjs/common';
import { setupTestApp, graphqlRequest } from './test-utils';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: a } = await setupTestApp();
    app = a;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('login', () => {
    test('login success returns token', async () => {
      const res = await graphqlRequest(app, {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input)
          }
        `,
        variables: {
          input: { email: 'admin@coastaleats.com', password: 'password123' },
        },
      }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.login).toBeTruthy();
      expect(typeof res.body.data.login).toBe('string');
    });

    test('login fails with wrong password', async () => {
      const res = await graphqlRequest(app, {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input)
          }
        `,
        variables: {
          input: { email: 'admin@coastaleats.com', password: 'wrong' },
        },
      }).expect(200);

      expect(res.body.data?.login).toBeNull();
    });

    test('login fails with non-existent email', async () => {
      const res = await graphqlRequest(app, {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input)
          }
        `,
        variables: {
          input: { email: 'nonexistent@test.com', password: 'password123' },
        },
      }).expect(200);

      expect(res.body.data?.login).toBeNull();
    });

    test('login requires valid email and password', async () => {
      const res = await graphqlRequest(app, {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input)
          }
        `,
        variables: { input: {} },
      });

      // Nest validation may return 400 for invalid DTO, or 200 with GraphQL errors
      expect([200, 400]).toContain(res.status);
      const errors = res.body.errors ?? res.body.message;
      expect(errors).toBeDefined();
      if (Array.isArray(errors)) expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('register', () => {
    let adminToken: string;

    beforeAll(async () => {
      const res = await graphqlRequest(app, {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input)
          }
        `,
        variables: {
          input: { email: 'admin@coastaleats.com', password: 'password123' },
        },
      }).expect(200);
      adminToken = res.body.data?.login;
    });

    test('register as Admin returns user', async () => {
      const uniqueEmail = `e2e-${Date.now()}@coastaleats.com`;
      const res = await graphqlRequest(
        app,
        {
          query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                id
                email
                role
                name
              }
            }
          `,
          variables: {
            input: {
              email: uniqueEmail,
              password: 'password123',
              role: 'Staff',
              name: 'New User',
            },
          },
        },
        adminToken,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.register).toBeDefined();
      expect(res.body.data.register.email).toBe(uniqueEmail);
      expect(res.body.data.register.role).toBe('Staff');
      expect(res.body.data.register.name).toBe('New User');
    });

    test('register as non-Admin is forbidden', async () => {
      const managerRes = await graphqlRequest(app, {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input)
          }
        `,
        variables: {
          input: { email: 'manager1@coastaleats.com', password: 'password123' },
        },
      }).expect(200);
      const managerToken = managerRes.body.data?.login;

      const res = await graphqlRequest(
        app,
        {
          query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                id
                email
              }
            }
          `,
          variables: {
            input: {
              email: 'other@coastaleats.com',
              password: 'password123',
              role: 'Staff',
              name: 'Other',
            },
          },
        },
        managerToken,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
      // When mutation fails, GraphQL may omit data.register (undefined) or set it to null
      expect([null, undefined]).toContain(res.body.data?.register);
    });
  });
});
