import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from './test-utils';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: a } = await setupTestApp();
    app = a;
  });

  afterAll(async () => {
    await app.close();
  });

  test('GET /health returns 200 and status', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
    expect(['ok', 'error']).toContain(res.body.status);
    if (res.body.status === 'ok') {
      expect(res.body.database).toBe('connected');
    }
  });
});
