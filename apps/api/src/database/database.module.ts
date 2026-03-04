import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  User,
  Location,
  Skill,
  ManagerLocation,
  StaffLocation,
  StaffSkill,
  Availability,
  AvailabilityException,
  DesiredHours,
  Shift,
  ShiftAssignment,
  ShiftRequest,
  Notification,
  NotificationPreference,
  AuditLog,
} from './models';
import { ShiftRepository } from './repositories/shift.repository';
import { ShiftAssignmentRepository } from './repositories/shift-assignment.repository';
import { UserRepository } from './repositories/user.repository';
import { LocationRepository } from './repositories/location.repository';
import { SkillRepository } from './repositories/skill.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { ShiftRequestRepository } from './repositories/shift-request.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Location,
      Skill,
      ManagerLocation,
      StaffLocation,
      StaffSkill,
      Availability,
      AvailabilityException,
      DesiredHours,
      Shift,
      ShiftAssignment,
      ShiftRequest,
      Notification,
      NotificationPreference,
      AuditLog,
    ]),
  ],
  providers: [
    ShiftRepository,
    ShiftAssignmentRepository,
    UserRepository,
    LocationRepository,
    SkillRepository,
    NotificationRepository,
    ShiftRequestRepository,
    AuditLogRepository,
  ],
  exports: [
    SequelizeModule,
    ShiftRepository,
    ShiftAssignmentRepository,
    UserRepository,
    LocationRepository,
    SkillRepository,
    NotificationRepository,
    ShiftRequestRepository,
    AuditLogRepository,
  ],
})
export class DatabaseModule {}
