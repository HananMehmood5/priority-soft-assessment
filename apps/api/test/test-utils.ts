import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const request = require('supertest') as (app: unknown) => import('supertest').SuperTest<import('supertest').Test>;

export async function setupTestApp(): Promise<{ app: INestApplication }> {
  const app = await NestFactory.create(AppModule);
  await app.init();
  return { app };
}

export function graphqlRequest(
  app: INestApplication,
  body: { query: string; variables?: Record<string, unknown> },
  token?: string,
): import('supertest').Test {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .set('Content-Type', 'application/json')
    .send(body);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
}
