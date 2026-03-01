import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { getSequelizeOptions } from './database.config';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      ...getSequelizeOptions(),
      autoLoadModels: true,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }),
    HealthModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
