import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import request from 'supertest';

export async function setupTestApp(): Promise<{ app: INestApplication }> {
  const app = await NestFactory.create(AppModule);
  await app.init();
  return { app };
}

export function graphqlRequest(
  app: INestApplication,
  body: { query: string; variables?: Record<string, unknown> },
  token?: string,
): request.Test {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .set('Content-Type', 'application/json')
    .send(body);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
}
