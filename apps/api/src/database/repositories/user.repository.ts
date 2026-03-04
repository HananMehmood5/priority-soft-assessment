import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { UserBaseAttributes } from '@shiftsync/shared';
import { Op } from 'sequelize';
import { UserRole } from '@shiftsync/shared';
import { User } from '../models/user.model';
import { Availability } from '../models/availability.model';
import { AvailabilityException } from '../models/availability-exception.model';
import { DesiredHours } from '../models/desired-hours.model';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Availability)
    private readonly availabilityModel: typeof Availability,
    @InjectModel(AvailabilityException)
    private readonly exceptionModel: typeof AvailabilityException,
    @InjectModel(DesiredHours)
    private readonly desiredHoursModel: typeof DesiredHours,
  ) {}

  async findById(
    id: string,
    options?: { excludePassword?: boolean; includeAssociations?: boolean },
  ): Promise<User | null> {
    const attrs = options?.excludePassword ? { exclude: ['passwordHash'] } : undefined;
    const include =
      options?.includeAssociations === true
        ? [
            { association: 'availabilities' },
            { association: 'availabilityExceptions' },
            { association: 'desiredHours' },
          ]
        : undefined;
    return this.userModel.findByPk(id, { attributes: attrs, include });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: UserBaseAttributes): Promise<User> {
    return this.userModel.create(data);
  }

  async updateName(id: string, name: string | null): Promise<User> {
    const user = await this.findByIdOrFail(id);
    await user.update({ name });
    return user;
  }

  async replaceAvailability(
    userId: string,
    items: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      locationId?: string | null;
    }>,
  ): Promise<void> {
    await this.availabilityModel.destroy({ where: { userId } });
    if (items.length > 0) {
      await this.availabilityModel.bulkCreate(
        items.map((a) => ({
          userId,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          locationId: a.locationId ?? null,
        })),
      );
    }
  }

  async appendDesiredHours(userId: string, weeklyHours: number): Promise<DesiredHours> {
    const effectiveFrom = new Date().toISOString().slice(0, 10);
    return this.desiredHoursModel.create({
      userId,
      weeklyHours: String(weeklyHours),
      effectiveFrom,
    });
  }

  async findAvailabilityForUserDayLocation(
    userId: string,
    dayOfWeek: number,
    locationId: string | null,
  ): Promise<Availability[]> {
    return this.availabilityModel.findAll({
      where: {
        userId,
        dayOfWeek,
        [Op.or]: [{ locationId: null }, { locationId: locationId ?? undefined }],
      },
    });
  }

  async findExceptionForUserDate(
    userId: string,
    dateStr: string,
    locationId: string | null,
  ): Promise<AvailabilityException | null> {
    return this.exceptionModel.findOne({
      where: {
        userId,
        date: dateStr,
        [Op.or]: [{ locationId: null }, { locationId: locationId ?? undefined }],
      },
    });
  }

  async findLatestDesiredHours(userId: string): Promise<DesiredHours | null> {
    return this.desiredHoursModel.findOne({
      where: { userId },
      order: [['effectiveFrom', 'DESC']],
    });
  }

  async findAllByIds(ids: string[], attributes?: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    return this.userModel.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: attributes ?? ['id', 'name'],
    });
  }

  async findByPk(id: string, options?: { attributes?: string[] }): Promise<User | null> {
    return this.userModel.findByPk(id, { attributes: options?.attributes as string[] });
  }

  async findAllByRole(role: UserRole, attributes?: string[]): Promise<User[]> {
    return this.userModel.findAll({
      where: { role },
      attributes: attributes ?? ['id'],
    });
  }
}
