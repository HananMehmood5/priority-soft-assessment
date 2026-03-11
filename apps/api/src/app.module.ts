import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { Request } from 'express';
import { getSequelizeOptions } from './database.config';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { SkillsModule } from './skills/skills.module';
import { ShiftsModule } from './shifts/shifts.module';
import { RequestsModule } from './requests/requests.module';
import { OvertimeModule } from './overtime/overtime.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      ...getSequelizeOptions(),
      autoLoadModels: true,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }: { req: Request }) => ({ req }),
      playground: true,
    }),
    DatabaseModule,
    PermissionsModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    SkillsModule,
    ShiftsModule,
    RequestsModule,
    OvertimeModule,
    ReportsModule,
    NotificationsModule,
    AuditModule,
    HealthModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
