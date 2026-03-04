import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SkillsResolver } from './skills.resolver';
import { SkillsService } from './skills.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [SkillsResolver, SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
