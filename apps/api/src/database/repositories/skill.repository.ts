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

  async findAllUserIdsBySkillId(skillId: string): Promise<string[]> {
    const rows = await this.staffSkillModel.findAll({
      where: { skillId },
      attributes: ['userId'],
    });
    return rows.map((r) => r.userId);
  }

  async findAllSkillIdsByUserId(userId: string): Promise<string[]> {
    const rows = await this.staffSkillModel.findAll({
      where: { userId },
      attributes: ['skillId'],
    });
    return rows.map((r) => r.skillId);
  }

  async findAllByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return [];
    return this.skillModel.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['name', 'ASC']],
    });
  }

  async createStaffSkill(userId: string, skillId: string): Promise<StaffSkill> {
    return this.staffSkillModel.create({ userId, skillId });
  }

  async removeStaffSkill(userId: string, skillId: string): Promise<void> {
    await this.staffSkillModel.destroy({
      where: { userId, skillId },
    });
  }
}
