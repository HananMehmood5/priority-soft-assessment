import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { ShiftRequestBaseAttributes } from '@shiftsync/shared';
import { RequestType, RequestStatus } from '@shiftsync/shared';
import { ShiftRequest } from '../models/shift-request.model';
import { ShiftAssignment } from '../models/shift-assignment.model';
import { Shift } from '../models/shift.model';
import { User } from '../models/user.model';

@Injectable()
export class ShiftRequestRepository {
  constructor(
    @InjectModel(ShiftRequest)
    private readonly requestModel: typeof ShiftRequest,
  ) {}

  async countPendingByAssignmentIds(assignmentIds: string[]): Promise<number> {
    if (assignmentIds.length === 0) return 0;
    return this.requestModel.count({
      where: {
        assignmentId: { [Op.in]: assignmentIds },
        status: RequestStatus.Pending,
      },
    });
  }

  async create(data: Pick<ShiftRequestBaseAttributes, 'type' | 'assignmentId' | 'status'>): Promise<ShiftRequest> {
    return this.requestModel.create({
      ...data,
      counterpartAssignmentId: null,
      claimerUserId: null,
    });
  }

  async findByPk(id: string): Promise<ShiftRequest | null> {
    return this.requestModel.findByPk(id);
  }

  async findByPkWithAssignmentAndShift(id: string): Promise<ShiftRequest | null> {
    return this.requestModel.findByPk(id, {
      include: [{ model: ShiftAssignment, as: 'assignment', include: [{ model: Shift, as: 'shift' }] }],
    });
  }

  async findByPkWithFullForApprove(id: string): Promise<ShiftRequest | null> {
    return this.requestModel.findByPk(id, {
      include: [
        { model: ShiftAssignment, as: 'assignment', include: [{ model: Shift, as: 'shift' }] },
        { model: ShiftAssignment, as: 'counterpartAssignment', include: [{ model: Shift, as: 'shift' }] },
        { model: User, as: 'claimer' },
      ],
    });
  }

  async findByPkWithAssignment(id: string): Promise<ShiftRequest | null> {
    return this.requestModel.findByPk(id, {
      include: [{ model: ShiftAssignment, as: 'assignment' }],
    });
  }

  async findByPkOrFail(id: string): Promise<ShiftRequest> {
    const request = await this.requestModel.findByPk(id);
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async updateAcceptSwap(id: string, counterpartAssignmentId: string): Promise<ShiftRequest> {
    const request = await this.findByPkOrFail(id);
    await request.update({
      counterpartAssignmentId,
      status: RequestStatus.Accepted,
    });
    return request;
  }

  async updateAcceptDrop(id: string, claimerUserId: string): Promise<ShiftRequest> {
    const request = await this.findByPkOrFail(id);
    await request.update({
      claimerUserId,
      status: RequestStatus.Accepted,
    });
    return request;
  }

  async updateStatus(id: string, status: RequestStatus): Promise<ShiftRequest> {
    const request = await this.findByPkOrFail(id);
    await request.update({ status });
    return request;
  }

  async cancelPendingByAssignmentIds(assignmentIds: string[]): Promise<number> {
    if (assignmentIds.length === 0) return 0;
    const [count] = await this.requestModel.update(
      { status: RequestStatus.Cancelled },
      {
        where: {
          assignmentId: { [Op.in]: assignmentIds },
          status: RequestStatus.Pending,
        },
      },
    );
    return count;
  }

  async findAllByAssignmentIds(assignmentIds: string[]): Promise<ShiftRequest[]> {
    if (assignmentIds.length === 0) return [];
    return this.requestModel.findAll({
      where: { assignmentId: { [Op.in]: assignmentIds } },
      order: [['createdAt', 'DESC']],
      include: ['assignment', 'counterpartAssignment', 'claimer'],
    });
  }

  /** Pending drop requests with assignment and shift (for staff "Available drops"). */
  async findAllPendingDrops(): Promise<ShiftRequest[]> {
    return this.requestModel.findAll({
      where: { type: RequestType.Drop, status: RequestStatus.Pending },
      order: [['createdAt', 'DESC']],
      include: [{ model: ShiftAssignment, as: 'assignment', include: [{ model: Shift, as: 'shift' }] }],
    });
  }

  /** Pending swap requests with assignment and shift (for staff "Available swaps"). */
  async findAllPendingSwaps(): Promise<ShiftRequest[]> {
    return this.requestModel.findAll({
      where: { type: RequestType.Swap, status: RequestStatus.Pending },
      order: [['createdAt', 'DESC']],
      include: [{ model: ShiftAssignment, as: 'assignment', include: [{ model: Shift, as: 'shift' }] }],
    });
  }

  async findAllPendingAndAccepted(): Promise<ShiftRequest[]> {
    return this.requestModel.findAll({
      where: { status: [RequestStatus.Pending, RequestStatus.Accepted] },
      order: [['createdAt', 'DESC']],
      include: ['assignment', 'counterpartAssignment', 'claimer'],
    });
  }

  async findAllPendingAndAcceptedByAssignmentIds(
    assignmentIds: string[],
  ): Promise<ShiftRequest[]> {
    if (assignmentIds.length === 0) return [];
    return this.requestModel.findAll({
      where: {
        assignmentId: { [Op.in]: assignmentIds },
        status: [RequestStatus.Pending, RequestStatus.Accepted],
      },
      order: [['createdAt', 'DESC']],
      include: ['assignment', 'counterpartAssignment', 'claimer'],
    });
  }

  async findByPkWithAssignmentAndCounterpartAndClaimer(
    id: string,
  ): Promise<ShiftRequest | null> {
    return this.requestModel.findByPk(id, {
      include: ['assignment', 'counterpartAssignment', 'claimer'],
    });
  }
}
