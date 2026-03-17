import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UserRole } from '@shiftsync/shared';
import { User } from '../database/models';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserEntity } from '../auth/entities/user.entity';
import { UpdateProfileInput } from './dto/update-profile.input';
import { SkillEntity } from '../skills/entities/skill.entity';
import { LocationEntity } from '../locations/entities/location.entity';

@Resolver(() => UserEntity)
@UseGuards(JwtAuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserEntity, { nullable: true })
  async me(@CurrentUser() user: User): Promise<User | null> {
    return this.usersService.findById(user.id);
  }

  @Query(() => [UserEntity])
  async staff(
    @CurrentUser() user: User,
    @Args('locationId', { nullable: true }) locationId?: string,
    @Args('skillId', { nullable: true }) skillId?: string,
    @Args('role', { nullable: true, type: () => UserRole }) role?: UserRole,
  ): Promise<User[]> {
    return this.usersService.getStaffList(user, { locationId, skillId, role });
  }

  @Query(() => UserEntity, { nullable: true })
  async user(
    @Args('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<User | null> {
    return this.usersService.findOneForStaffList(id, currentUser);
  }

  @ResolveField(() => [SkillEntity])
  async skills(@Parent() user: User): Promise<unknown[]> {
    return this.usersService.getSkillsForUser(user.id);
  }

  @ResolveField(() => [LocationEntity])
  async certifiedLocations(@Parent() user: User): Promise<unknown[]> {
    return this.usersService.getCertifiedLocationsForUser(user.id);
  }

  @Mutation(() => UserEntity)
  async updateMyProfile(
    @Args('input') input: UpdateProfileInput,
    @CurrentUser() user: User,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, {
      name: input.name,
      availabilities: input.availabilities,
      desiredWeeklyHours: input.desiredWeeklyHours,
    });
  }
}
