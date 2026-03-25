import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { ValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOriginEnv =
    process.env.CORS_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? '*';

  const corsOrigin =
    corsOriginEnv === '*'
      ? true
      : corsOriginEnv.split(',').map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());

  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
  console.log(`WebSocket (Socket.io) available at ws://localhost:${port}`);
}
bootstrap();
