import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Location } from '../database/models';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@shiftsync/shared';
import { LocationsService } from './locations.service';
import { LocationEntity } from './entities/location.entity';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';

@Resolver(() => LocationEntity)
@UseGuards(JwtAuthGuard)
export class LocationsResolver {
  constructor(private readonly locationsService: LocationsService) {}

  @Query(() => [LocationEntity])
  async locations(@CurrentUser() user: import('../database/models').User): Promise<Location[]> {
    return this.locationsService.findAll(user);
  }

  @Query(() => LocationEntity, { nullable: true })
  async location(
    @Args('id') id: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Location | null> {
    try {
      return await this.locationsService.findOne(id, user);
    } catch {
      return null;
    }
  }

  @Mutation(() => LocationEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async createLocation(
    @Args('input') input: CreateLocationInput,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Location> {
    return this.locationsService.create(input, user);
  }

  @Mutation(() => LocationEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async updateLocation(
    @Args('id') id: string,
    @Args('input') input: UpdateLocationInput,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Location> {
    return this.locationsService.update(id, input, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async deleteLocation(
    @Args('id') id: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<boolean> {
    return this.locationsService.remove(id, user);
  }
}
