import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OvertimeService } from './overtime.service';
import { OvertimeResolver } from './overtime.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [OvertimeService, OvertimeResolver],
  exports: [OvertimeService],
})
export class OvertimeModule {}
