import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Shift, ShiftAssignment, Location, User, Skill } from '../database/models';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@shiftsync/shared';
import { ShiftsService } from './shifts.service';
import { ShiftEntity } from './entities/shift.entity';
import { ShiftAssignmentEntity } from './entities/shift-assignment.entity';
import { AddAssignmentResult } from './entities/add-assignment-result.entity';
import { CreateShiftInput } from './dto/create-shift.input';
import { UpdateShiftInput } from './dto/update-shift.input';
import { AddAssignmentInput } from './dto/add-assignment.input';
import { LocationRepository, UserRepository, SkillRepository } from '../database/repositories';
import { LocationEntity } from '../locations/entities/location.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { SkillEntity } from '../skills/entities/skill.entity';

@Resolver(() => ShiftEntity)
@UseGuards(JwtAuthGuard)
export class ShiftsResolver {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly locationRepository: LocationRepository,
  ) {}

  @Query(() => [ShiftEntity])
  async shifts(@CurrentUser() user: import('../database/models').User): Promise<Shift[]> {
    return this.shiftsService.findForManager(user);
  }

  @ResolveField(() => [ShiftAssignmentEntity], { name: 'assignments', nullable: 'itemsAndList' })
  assignments(@Parent() shift: Shift & { assignments?: ShiftAssignment[] }): ShiftAssignment[] | undefined {
    return shift.assignments;
  }

  @ResolveField(() => LocationEntity, { nullable: true })
  async location(@Parent() shift: Shift & { locationId: string }): Promise<Location | null> {
    const loc = await this.locationRepository.findById(shift.locationId);
    return (loc as Location) ?? null;
  }

  @Query(() => [ShiftAssignmentEntity])
  async myAssignments(
    @CurrentUser() user: import('../database/models').User,
  ): Promise<ShiftAssignment[]> {
    return this.shiftsService.findMyAssignments(user);
  }

  @Query(() => [ShiftEntity])
  async onDutyShifts(
    @Args('userId', { type: () => String, nullable: true }) userId: string | undefined,
    @Args('locationId', { type: () => String, nullable: true }) locationId: string | undefined,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Shift[]> {
    return this.shiftsService.findOnDuty(user, { userId, locationId });
  }

  @Query(() => ShiftEntity, { nullable: true })
  async shift(
    @Args('id') id: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Shift | null> {
    return this.shiftsService.findOne(id, user);
  }

  @Mutation(() => ShiftEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async createShift(
    @Args('input') input: CreateShiftInput,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Shift> {
    return this.shiftsService.create(input, user);
  }

  @Mutation(() => ShiftEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async updateShift(
    @Args('id') id: string,
    @Args('input') input: UpdateShiftInput,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Shift> {
    return this.shiftsService.update(id, input, user);
  }

  @Mutation(() => AddAssignmentResult)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async addAssignment(
    @Args('shiftId') shiftId: string,
    @Args('input') input: AddAssignmentInput,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<AddAssignmentResult> {
    const result = await this.shiftsService.addAssignment(
      shiftId,
      { userId: input.userId, skillId: input.skillId, overtimeOverrideReason: input.overtimeOverrideReason },
      user,
    );
    if (result.constraintError) {
      return {
        constraintError: {
          message: result.constraintError.message!,
          alternatives: result.constraintError.alternatives ?? undefined,
        },
      };
    }
    return { assignment: result.assignment as any };
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async removeAssignment(
    @Args('assignmentId') assignmentId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<boolean> {
    return this.shiftsService.removeAssignment(assignmentId, user);
  }

  @Mutation(() => ShiftEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async publishShift(
    @Args('shiftId') shiftId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Shift> {
    return this.shiftsService.publish(shiftId, user);
  }

  @Mutation(() => Number)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async publishWeek(
    @Args('locationId') locationId: string,
    @Args('weekStart') weekStart: Date,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<number> {
    return this.shiftsService.publishWeek(locationId, new Date(weekStart), user);
  }

  @Mutation(() => ShiftEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async unpublishShift(
    @Args('shiftId') shiftId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<Shift> {
    return this.shiftsService.unpublish(shiftId, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async deleteShift(
    @Args('id') id: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<boolean> {
    await this.shiftsService.delete(id, user);
    return true;
  }
}

@Resolver(() => ShiftAssignmentEntity)
@UseGuards(JwtAuthGuard)
export class ShiftAssignmentResolver {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly skillRepository: SkillRepository,
  ) {}

  @ResolveField(() => ShiftEntity)
  shift(
    @Parent() assignment: ShiftAssignment & { shift?: Shift },
  ): Shift | undefined {
    return assignment.shift;
  }

  @ResolveField(() => UserEntity, { nullable: true })
  async user(
    @Parent() assignment: ShiftAssignment & { userId: string },
  ): Promise<User | null> {
    const user = await this.userRepository.findById(assignment.userId, {
      excludePassword: true,
    });
    return (user as User) ?? null;
  }

  @ResolveField(() => SkillEntity, { nullable: true })
  async skill(
    @Parent() assignment: ShiftAssignment & { skillId: string },
  ): Promise<Skill | null> {
    const skill = await this.skillRepository.findById(assignment.skillId);
    return (skill as Skill) ?? null;
  }
}
