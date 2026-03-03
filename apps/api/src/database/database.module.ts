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
  providers: [ShiftRepository, ShiftAssignmentRepository],
  exports: [SequelizeModule, ShiftRepository, ShiftAssignmentRepository],
})
export class DatabaseModule {}
