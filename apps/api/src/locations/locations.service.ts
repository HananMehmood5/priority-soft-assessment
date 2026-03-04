import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { UserRole } from '@shiftsync/shared';
import { Location, User } from '../database/models';
import { LocationRepository } from '../database/repositories/location.repository';

@Injectable()
export class LocationsService {
  constructor(private readonly locationRepository: LocationRepository) {}

  /** Resolve which location IDs the user is allowed to see */
  async getVisibleLocationIds(user: User): Promise<string[] | null> {
    if (user.role === UserRole.Admin) return null; // null = all
    if (user.role === UserRole.Manager) {
      return this.locationRepository.getManagerLocationIdsByUserId(user.id);
    }
    if (user.role === UserRole.Staff) {
      return this.locationRepository.getStaffLocationIdsByUserId(user.id);
    }
    return [];
  }

  async findAll(user: User): Promise<Location[]> {
    const visibleIds = await this.getVisibleLocationIds(user);
    if (visibleIds?.length === 0) return [];
    const where = visibleIds === null ? {} : { id: { [Op.in]: visibleIds } };
    return this.locationRepository.findAll(where);
  }

  async findOne(id: string, user: User): Promise<Location> {
    const location = await this.locationRepository.findById(id);
    if (!location) throw new NotFoundException('Location not found');
    const visibleIds = await this.getVisibleLocationIds(user);
    if (visibleIds !== null && !visibleIds.includes(location.id)) {
      throw new ForbiddenException('Access denied to this location');
    }
    return location;
  }

  async create(data: { name: string; timezone: string }, user: User): Promise<Location> {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only Admin can create locations');
    }
    return this.locationRepository.create(data);
  }

  async update(id: string, data: { name?: string; timezone?: string }, user: User): Promise<Location> {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only Admin can update locations');
    }
    return this.locationRepository.update(id, data);
  }

  async remove(id: string, user: User): Promise<boolean> {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only Admin can delete locations');
    }
    await this.locationRepository.remove(id);
    return true;
  }
}
