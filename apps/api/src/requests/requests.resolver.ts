import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@shiftsync/shared';
import { RequestsService } from './requests.service';
import { RequestEntity } from './entities/request.entity';
import { AcceptRequestResult } from './entities/accept-result.entity';
import { ShiftAssignmentEntity } from '../shifts/entities/shift-assignment.entity';
import { ShiftRequest } from '../database/models';

@Resolver(() => RequestEntity)
@UseGuards(JwtAuthGuard)
export class RequestsResolver {
  constructor(private readonly requestsService: RequestsService) {}

  @ResolveField(() => ShiftAssignmentEntity, { nullable: true })
  assignment(
    @Parent() request: ShiftRequest & { assignment?: unknown },
  ): unknown {
    return request.assignment;
  }

  @Query(() => [RequestEntity])
  async myRequests(@CurrentUser() user: import('../database/models').User): Promise<ShiftRequest[]> {
    return this.requestsService.findMyRequests(user);
  }

  @Query(() => [RequestEntity])
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async pendingRequests(@CurrentUser() user: import('../database/models').User): Promise<ShiftRequest[]> {
    return this.requestsService.findPendingForManager(user);
  }

  @Query(() => [RequestEntity])
  async availableDrops(): Promise<ShiftRequest[]> {
    return this.requestsService.findAvailableDrops();
  }

  @Query(() => [RequestEntity])
  async availableSwaps(
    @CurrentUser() user: import('../database/models').User,
  ): Promise<ShiftRequest[]> {
    return this.requestsService.findAvailableSwaps(user);
  }

  @Mutation(() => RequestEntity)
  async createSwapRequest(
    @Args('assignmentId') assignmentId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<ShiftRequest> {
    return this.requestsService.createSwap(assignmentId, user);
  }

  @Mutation(() => RequestEntity)
  async createDropRequest(
    @Args('assignmentId') assignmentId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<ShiftRequest> {
    return this.requestsService.createDrop(assignmentId, user);
  }

  @Mutation(() => AcceptRequestResult)
  async acceptSwapRequest(
    @Args('requestId') requestId: string,
    @Args('counterpartAssignmentId') counterpartAssignmentId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<AcceptRequestResult> {
    const result = await this.requestsService.acceptSwap(requestId, counterpartAssignmentId, user);
    if (result.constraintError) {
      return {
        constraintError: {
          message: result.constraintError.message!,
          alternatives: result.constraintError.alternatives ?? undefined,
        },
      };
    }
    return { request: result.request as any };
  }

  @Mutation(() => AcceptRequestResult)
  async acceptDropRequest(
    @Args('requestId') requestId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<AcceptRequestResult> {
    const result = await this.requestsService.acceptDrop(requestId, user);
    if (result.constraintError) {
      return {
        constraintError: {
          message: result.constraintError.message!,
          alternatives: result.constraintError.alternatives ?? undefined,
        },
      };
    }
    return { request: result.request as any };
  }

  @Mutation(() => RequestEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async approveRequest(
    @Args('requestId') requestId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<ShiftRequest> {
    return this.requestsService.approve(requestId, user);
  }

  @Mutation(() => RequestEntity)
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin, UserRole.Manager)
  async rejectRequest(
    @Args('requestId') requestId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<ShiftRequest> {
    return this.requestsService.reject(requestId, user);
  }

  @Mutation(() => RequestEntity)
  async cancelRequest(
    @Args('requestId') requestId: string,
    @CurrentUser() user: import('../database/models').User,
  ): Promise<ShiftRequest> {
    return this.requestsService.cancel(requestId, user);
  }
}
