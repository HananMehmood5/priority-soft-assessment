import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@shiftsync/shared';
import { Op } from 'sequelize';
import { User } from '../database/models';
import { UserRepository } from '../database/repositories/user.repository';
import { LocationRepository } from '../database/repositories/location.repository';
import { SkillRepository } from '../database/repositories/skill.repository';

export type StaffListFilters = {
  locationId?: string;
  skillId?: string;
  role?: UserRole;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly locationRepository: LocationRepository,
    private readonly skillRepository: SkillRepository,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id, {
      excludePassword: true,
      includeAssociations: true,
    });
  }

  /** Resolve which location IDs the current user can see staff for (null = all for Admin). */
  private async getVisibleLocationIdsForStaff(user: User): Promise<string[] | null> {
    if (user.role === UserRole.Admin) return null;
    if (user.role === UserRole.Manager) {
      return this.locationRepository.getManagerLocationIdsByUserId(user.id);
    }
    return [];
  }

  async getStaffList(currentUser: User, filters: StaffListFilters): Promise<User[]> {
    const visibleLocationIds = await this.getVisibleLocationIdsForStaff(currentUser);
    if (visibleLocationIds !== null && visibleLocationIds.length === 0) return [];

    const role = filters.role ?? UserRole.Staff;

    let candidateIds: string[] | null = null;

    if (visibleLocationIds !== null) {
      candidateIds = await this.locationRepository.getStaffUserIdsByLocationIds(
        visibleLocationIds,
      );
      if (candidateIds.length === 0) return [];
    }

    if (filters.locationId) {
      const allowed =
        visibleLocationIds === null || visibleLocationIds.includes(filters.locationId);
      if (!allowed) return [];
      const atLocation = await this.locationRepository.getStaffUserIdsByLocationId(
        filters.locationId,
      );
      if (atLocation.length === 0) return [];
      candidateIds =
        candidateIds === null
          ? atLocation
          : candidateIds.filter((id) => atLocation.includes(id));
      if (candidateIds.length === 0) return [];
    }

    if (filters.skillId) {
      const withSkill = await this.skillRepository.findAllUserIdsBySkillId(filters.skillId);
      if (withSkill.length === 0) return [];
      candidateIds =
        candidateIds === null
          ? withSkill
          : candidateIds.filter((id) => withSkill.includes(id));
      if (candidateIds.length === 0) return [];
    }

    if (candidateIds === null) {
      const allWithRole = await this.userRepository.findAllByRole(role, [
        'id',
        'email',
        'name',
        'role',
        'createdAt',
        'updatedAt',
      ]);
      return allWithRole;
    }

    return this.userRepository.findAllByIdsAndRole(candidateIds, role);
  }

  async findOneForStaffList(userId: string, currentUser: User): Promise<User | null> {
    const visibleLocationIds = await this.getVisibleLocationIdsForStaff(currentUser);
    if (visibleLocationIds !== null && visibleLocationIds.length === 0) return null;

    const user = await this.userRepository.findById(userId, {
      excludePassword: true,
      includeAssociations: false,
    });
    if (!user) return null;

    if (visibleLocationIds !== null) {
      const staffLocationIds = await this.locationRepository.getStaffLocationIdsByUserId(
        user.id,
      );
      const canSee = staffLocationIds.some((lid) => visibleLocationIds.includes(lid));
      if (!canSee) return null;
    }

    return user;
  }

  async getSkillsForUser(userId: string) {
    const skillIds = await this.skillRepository.findAllSkillIdsByUserId(userId);
    if (skillIds.length === 0) return [];
    return this.skillRepository.findAllByIds(skillIds);
  }

  async getCertifiedLocationsForUser(userId: string) {
    const locationIds = await this.locationRepository.getStaffLocationIdsByUserId(userId);
    if (locationIds.length === 0) return [];
    return this.locationRepository.findAll({ id: { [Op.in]: locationIds } });
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      availabilities?: Array<{ dayOfWeek: number; startTime: string; endTime: string; locationId?: string }>;
      desiredWeeklyHours?: number;
    },
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (data.name !== undefined) await this.userRepository.updateName(userId, data.name);
    if (data.availabilities !== undefined) {
      await this.userRepository.replaceAvailability(userId, data.availabilities);
    }
    if (data.desiredWeeklyHours !== undefined) {
      await this.userRepository.appendDesiredHours(userId, data.desiredWeeklyHours);
    }
    const updated = await this.userRepository.findById(userId, { excludePassword: true });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
}
