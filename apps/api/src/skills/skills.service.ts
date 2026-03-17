import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@shiftsync/shared';
import { Skill, User } from '../database/models';
import { SkillRepository } from '../database/repositories/skill.repository';
import { LocationRepository } from '../database/repositories/location.repository';
import { UserRepository } from '../database/repositories/user.repository';

@Injectable()
export class SkillsService {
  constructor(
    private readonly skillRepository: SkillRepository,
    private readonly locationRepository: LocationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async findAll(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }

  async findOne(id: string): Promise<Skill> {
    return this.skillRepository.findByIdOrFail(id);
  }

  async create(data: { name: string }, user: User): Promise<Skill> {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only Admin can create skills');
    }
    return this.skillRepository.create(data);
  }

  async update(id: string, data: { name?: string }, user: User): Promise<Skill> {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only Admin can update skills');
    }
    return this.skillRepository.update(id, data);
  }

  async remove(id: string, user: User): Promise<boolean> {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Only Admin can delete skills');
    }
    await this.skillRepository.remove(id);
    return true;
  }

  private async canManageStaff(currentUser: User, staffId: string): Promise<boolean> {
    if (currentUser.role === UserRole.Admin) return true;
    if (currentUser.role !== UserRole.Manager) return false;
    const staff = await this.userRepository.findById(staffId);
    if (!staff || staff.role !== UserRole.Staff) return false;
    const managerLocationIds = await this.locationRepository.getManagerLocationIdsByUserId(
      currentUser.id,
    );
    const staffLocationIds = await this.locationRepository.getStaffLocationIdsByUserId(staffId);
    return staffLocationIds.some((lid) => managerLocationIds.includes(lid));
  }

  async assignSkillToStaff(staffId: string, skillId: string, currentUser: User): Promise<boolean> {
    if (currentUser.role !== UserRole.Admin && currentUser.role !== UserRole.Manager) {
      throw new ForbiddenException('Only Admin or Manager can assign skills to staff');
    }
    const canManage = await this.canManageStaff(currentUser, staffId);
    if (!canManage) throw new ForbiddenException('Cannot manage this staff member');
    await this.skillRepository.findByIdOrFail(skillId);
    const existing = await this.skillRepository.findStaffSkill(staffId, skillId);
    if (existing) return true;
    await this.skillRepository.createStaffSkill(staffId, skillId);
    return true;
  }

  async removeSkillFromStaff(staffId: string, skillId: string, currentUser: User): Promise<boolean> {
    if (currentUser.role !== UserRole.Admin && currentUser.role !== UserRole.Manager) {
      throw new ForbiddenException('Only Admin or Manager can remove skills from staff');
    }
    const canManage = await this.canManageStaff(currentUser, staffId);
    if (!canManage) throw new ForbiddenException('Cannot manage this staff member');
    await this.skillRepository.removeStaffSkill(staffId, skillId);
    return true;
  }
}
