import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConstraintsService } from './constraints.service';

@Module({
  imports: [DatabaseModule],
  providers: [ConstraintsService],
  exports: [ConstraintsService],
})
export class ConstraintsModule {}
