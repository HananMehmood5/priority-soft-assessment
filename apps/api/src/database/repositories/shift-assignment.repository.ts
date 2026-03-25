import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { ShiftAssignmentBaseAttributes } from '@shiftsync/shared';
import { Op } from 'sequelize';
import { WhereOptions } from 'sequelize';
import { ShiftAssignment } from '../models/shift-assignment.model';
import { Shift } from '../models/shift.model';
import { User } from '../models/user.model';

@Injectable()
export class ShiftAssignmentRepository {
  constructor(
    @InjectModel(ShiftAssignment)
    private readonly assignmentModel: typeof ShiftAssignment,
  ) {}

  async findById(id: string): Promise<ShiftAssignment | null> {
    return this.assignmentModel.findByPk(id);
  }

  async findByIdOrFail(id: string): Promise<ShiftAssignment> {
    const assignment = await this.assignmentModel.findByPk(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async findByIdWithShift(id: string): Promise<ShiftAssignment | null> {
    return this.assignmentModel.findByPk(id, {
      include: [{ model: Shift, as: 'shift' }],
    });
  }

  async findByIdOrFailWithShift(id: string): Promise<ShiftAssignment> {
    const assignment = await this.assignmentModel.findByPk(id, {
      include: [{ model: Shift, as: 'shift' }],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async getAssignmentIdsForShift(shiftId: string): Promise<string[]> {
    const rows = await this.assignmentModel.findAll({
      where: { shiftId },
      attributes: ['id'],
    });
    return rows.map((r) => r.id);
  }

  async findAllByUserId(userId: string, attributes?: string[]): Promise<ShiftAssignment[]> {
    return this.assignmentModel.findAll({
      where: { userId },
      attributes: attributes ?? ['id', 'userId', 'shiftId', 'skillId', 'version'],
    });
  }

  async findAllByShiftId(shiftId: string, attributes?: string[]): Promise<ShiftAssignment[]> {
    return this.assignmentModel.findAll({
      where: { shiftId },
      attributes: attributes ?? ['id'],
    });
  }

  async create(data: ShiftAssignmentBaseAttributes): Promise<ShiftAssignment> {
    return this.assignmentModel.create({
      ...data,
      version: data.version ?? 1,
      overtimeOverrideReason: data.overtimeOverrideReason ?? null,
    });
  }

  async updateUserAndVersion(
    id: string,
    userId: string,
    version: number,
  ): Promise<ShiftAssignment> {
    const assignment = await this.findByIdOrFail(id);
    await assignment.update({ userId, version });
    return assignment;
  }

  async delete(id: string): Promise<void> {
    const assignment = await this.findByIdOrFail(id);
    await assignment.destroy();
  }

  /** Assignments for user with shift in time window (e.g. week or day). */
  async findAllByUserIdWithShiftInTimeWindow(
    userId: string,
    window: { rangeStart: Date; rangeEnd: Date },
  ): Promise<ShiftAssignment[]> {
    // Shift template overlaps the requested range if startDate <= rangeEnd && endDate >= rangeStart
    const shiftWhere: Record<string, unknown> = {
      startDate: { [Op.lte]: window.rangeEnd },
      endDate: { [Op.gte]: window.rangeStart },
    };
    return this.assignmentModel.findAll({
      where: { userId },
      include: [
        {
          model: Shift,
          as: 'shift',
          required: true,
          where: shiftWhere,
        },
      ],
    });
  }

  /** All assignments for user with shift (for constraint checks). */
  async findAllByUserIdWithShift(userId: string): Promise<ShiftAssignment[]> {
    return this.assignmentModel.findAll({
      where: { userId },
      include: [{ model: Shift, as: 'shift', required: true }],
    });
  }

  /** Assignments with shift matching where and user (for reports). */
  async findAllWithShiftWhereAndUser(shiftWhere: WhereOptions): Promise<ShiftAssignment[]> {
    return this.assignmentModel.findAll({
      include: [
        { model: Shift, as: 'shift', required: true, where: shiftWhere },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
    });
  }
}
