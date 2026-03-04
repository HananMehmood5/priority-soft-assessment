import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@shiftsync/shared';
import { Skill, User } from '../database/models';
import { SkillRepository } from '../database/repositories/skill.repository';

@Injectable()
export class SkillsService {
  constructor(private readonly skillRepository: SkillRepository) {}

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
}
