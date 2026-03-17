import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Skill } from '../database/models';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@shiftsync/shared';
import { SkillsService } from './skills.service';
import { SkillEntity } from './entities/skill.entity';
import { CreateSkillInput } from './dto/create-skill.input';
import { UpdateSkillInput } from './dto/update-skill.input';

@Resolver(() => SkillEntity)
@UseGuards(JwtAuthGuard)
export class SkillsResolver {
  constructor(private readonly skillsService: SkillsService) {}

  @Query(() => [SkillEntity])
  async skills(): Promise<Skill[]> {
    return this.skillsService.findAll();
  }

  @Query(() => SkillEntity, { nullable: true })
  async skill(@Args('id') id: string): Promise<Skill | null> {
    try {
      return await this.skillsService.findOne(id);
    } catch {
      return null;
    }
  }

  @Mutation(() => SkillEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async createSkill(
    @Args('input') input: CreateSkillInput,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Skill> {
    return this.skillsService.create(input, user);
  }

  @Mutation(() => SkillEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async updateSkill(
    @Args('id') id: string,
    @Args('input') input: UpdateSkillInput,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Skill> {
    return this.skillsService.update(id, input, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async deleteSkill(
    @Args('id') id: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<boolean> {
    return this.skillsService.remove(id, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async assignSkillToStaff(
    @Args('staffId') staffId: string,
    @Args('skillId') skillId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<boolean> {
    return this.skillsService.assignSkillToStaff(staffId, skillId, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async removeSkillFromStaff(
    @Args('staffId') staffId: string,
    @Args('skillId') skillId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<boolean> {
    return this.skillsService.removeSkillFromStaff(staffId, skillId, user);
  }
}
