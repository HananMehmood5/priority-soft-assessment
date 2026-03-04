import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { SkillBaseAttributes } from '@shiftsync/shared';
import { Op } from 'sequelize';
import { Skill } from '../models/skill.model';
import { StaffSkill } from '../models/staff-skill.model';

@Injectable()
export class SkillRepository {
  constructor(
    @InjectModel(Skill)
    private readonly skillModel: typeof Skill,
    @InjectModel(StaffSkill)
    private readonly staffSkillModel: typeof StaffSkill,
  ) { }

  async findAll(): Promise<Skill[]> {
    return this.skillModel.findAll({ order: [['name', 'ASC']] });
  }

  async findById(id: string): Promise<Skill | null> {
    return this.skillModel.findByPk(id);
  }

  async findByIdOrFail(id: string): Promise<Skill> {
    const skill = await this.skillModel.findByPk(id);
    if (!skill) throw new NotFoundException('Skill not found');
    return skill;
  }

  async create(data: SkillBaseAttributes): Promise<Skill> {
    return this.skillModel.create(data);
  }

  async update(id: string, data: { name?: string }): Promise<Skill> {
    const skill = await this.findByIdOrFail(id);
    await skill.update(data);
    return skill;
  }

  async remove(id: string): Promise<void> {
    const skill = await this.findByIdOrFail(id);
    await skill.destroy();
  }

  async findStaffSkill(userId: string, skillId: string): Promise<StaffSkill | null> {
    return this.staffSkillModel.findOne({
      where: { userId, skillId },
    });
  }

  async findAllStaffSkillsBySkillAndUserIds(
    skillId: string,
    userIds: string[],
  ): Promise<StaffSkill[]> {
    if (userIds.length === 0) return [];
    return this.staffSkillModel.findAll({
      where: { skillId, userId: { [Op.in]: userIds } },
      attributes: ['userId'],
    });
  }
}
