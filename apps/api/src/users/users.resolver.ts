import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from '../database/models';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserEntity } from '../auth/entities/user.entity';
import { UpdateProfileInput } from './dto/update-profile.input';

@Resolver(() => UserEntity)
@UseGuards(JwtAuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserEntity, { nullable: true })
  async me(@CurrentUser() user: User): Promise<User | null> {
    return this.usersService.findById(user.id);
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
