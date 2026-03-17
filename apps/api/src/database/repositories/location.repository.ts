import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { LocationBaseAttributes } from '@shiftsync/shared';
import { Op } from 'sequelize';
import { Location } from '../models/location.model';
import { ManagerLocation } from '../models/manager-location.model';
import { StaffLocation } from '../models/staff-location.model';

@Injectable()
export class LocationRepository {
  constructor(
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
    @InjectModel(ManagerLocation)
    private readonly managerLocationModel: typeof ManagerLocation,
    @InjectModel(StaffLocation)
    private readonly staffLocationModel: typeof StaffLocation,
  ) {}

  async getManagerLocationIdsByUserId(userId: string): Promise<string[]> {
    const rows = await this.managerLocationModel.findAll({
      where: { userId },
      attributes: ['locationId'],
    });
    return rows.map((r) => r.locationId);
  }

  async getStaffLocationIdsByUserId(userId: string): Promise<string[]> {
    const rows = await this.staffLocationModel.findAll({
      where: { userId },
      attributes: ['locationId'],
    });
    return rows.map((r) => r.locationId);
  }

  async findManagerLocation(userId: string, locationId: string): Promise<ManagerLocation | null> {
    return this.managerLocationModel.findOne({
      where: { userId, locationId },
    });
  }

  async findStaffLocation(userId: string, locationId: string): Promise<StaffLocation | null> {
    return this.staffLocationModel.findOne({
      where: { userId, locationId },
    });
  }

  async findAllStaffLocationsByLocationId(locationId: string): Promise<StaffLocation[]> {
    return this.staffLocationModel.findAll({
      where: { locationId },
      attributes: ['userId'],
    });
  }

  async getStaffUserIdsByLocationId(locationId: string): Promise<string[]> {
    const rows = await this.findAllStaffLocationsByLocationId(locationId);
    return [...new Set(rows.map((r) => r.userId))];
  }

  async getStaffUserIdsByLocationIds(locationIds: string[]): Promise<string[]> {
    if (locationIds.length === 0) return [];
    const rows = await this.staffLocationModel.findAll({
      where: { locationId: { [Op.in]: locationIds } },
      attributes: ['userId'],
    });
    return [...new Set(rows.map((r) => r.userId))];
  }

  async findAll(where?: { id?: { [Op.in]: string[] } }): Promise<Location[]> {
    return this.locationModel.findAll({
      where: where ?? {},
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string): Promise<Location | null> {
    return this.locationModel.findByPk(id);
  }

  async findByIdOrFail(id: string): Promise<Location> {
    const location = await this.locationModel.findByPk(id);
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async create(data: LocationBaseAttributes): Promise<Location> {
    return this.locationModel.create(data);
  }

  async update(
    id: string,
    data: { name?: string; timezone?: string },
  ): Promise<Location> {
    const location = await this.findByIdOrFail(id);
    await location.update(data);
    return location;
  }

  async remove(id: string): Promise<void> {
    const location = await this.findByIdOrFail(id);
    await location.destroy();
  }
}
