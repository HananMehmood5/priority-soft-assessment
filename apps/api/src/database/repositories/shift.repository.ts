import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { ShiftBaseAttributesDb } from '@shiftsync/shared';
import { Op } from 'sequelize';
import { Shift } from '../models/shift.model';

@Injectable()
export class ShiftRepository {
  constructor(
    @InjectModel(Shift)
    private readonly shiftModel: typeof Shift,
  ) { }

  async findById(id: string): Promise<Shift | null> {
    return this.shiftModel.findByPk(id);
  }

  async findByIdOrFail(id: string): Promise<Shift> {
    const shift = await this.shiftModel.findByPk(id);
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async findByIdWithDetails(id: string): Promise<Shift | null> {
    return this.shiftModel.findByPk(id, {
      include: ['location', 'assignments'],
    });
  }

  async findByIdOrFailWithDetails(id: string): Promise<Shift> {
    const shift = await this.shiftModel.findByPk(id, {
      include: ['location', 'assignments'],
    });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async findAllByLocationIds(
    locationIds: string[],
    options: { order?: [string, string] } = {},
  ): Promise<Shift[]> {
    if (locationIds.length === 0) return [];
    return this.shiftModel.findAll({
      where: { locationId: { [Op.in]: locationIds } },
      order: options.order ?? [['startAt', 'ASC']],
      include: ['location', 'assignments'],
    });
  }

  async findAll(options: { order?: [string, string] } = {}): Promise<Shift[]> {
    return this.shiftModel.findAll({
      order: options.order ?? [['startAt', 'ASC']],
      include: ['location', 'assignments'],
    });
  }

  async findInWindow(where: {
    startAt: { lte: Date; gt?: Date };
    endAt: { gt: Date };
    published?: boolean;
    locationId?: string;
  }): Promise<Shift[]> {
    const cond: Record<string, unknown> = {
      startAt: { [Op.lte]: where.startAt.lte },
      endAt: { [Op.gt]: where.endAt.gt },
    };
    if (where.published !== undefined) cond.published = where.published;
    if (where.locationId) cond.locationId = where.locationId;
    return this.shiftModel.findAll({
      where: cond,
      include: ['location', 'assignments'],
      order: [['startAt', 'ASC']],
    });
  }

  async create(data: ShiftBaseAttributesDb): Promise<Shift> {
    return this.shiftModel.create({
      ...data,
      published: data.published ?? false,
    });
  }

  async updatePublished(id: string, published: boolean): Promise<Shift> {
    const shift = await this.findByIdOrFail(id);
    await shift.update({ published });
    return shift;
  }

  async updateWeekPublished(
    locationId: string,
    weekStart: Date,
    weekEnd: Date,
    published: boolean,
  ): Promise<number> {
    const [count] = await this.shiftModel.update(
      { published },
      {
        where: {
          locationId,
          startAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
        },
      },
    );
    return count;
  }

  /** For overtime dashboard: shifts in [start, end] with assignments and user. */
  async findAllInRangeWithAssignmentsAndUser(
    start: Date,
    end: Date,
    locationId?: string | null,
  ): Promise<Shift[]> {
    const where: Record<string, unknown> = {
      startAt: { [Op.gte]: start },
      endAt: { [Op.lte]: end },
    };
    if (locationId) where.locationId = locationId;
    return this.shiftModel.findAll({
      where,
      include: [{ association: 'assignments', include: ['user'] }],
    });
  }

  /** For reports: shifts matching where with assignments, user, and location. */
  async findAllWithAssignmentsAndUserAndLocation(
    where: Record<string, unknown>,
  ): Promise<Shift[]> {
    return this.shiftModel.findAll({
      where,
      include: [
        { association: 'assignments', include: [{ association: 'user', attributes: ['id', 'name'] }] },
        'location',
      ],
    });
  }
}
