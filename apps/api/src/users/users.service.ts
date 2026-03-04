import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../database/models';
import { UserRepository } from '../database/repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) { }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id, {
      excludePassword: true,
      includeAssociations: true,
    });
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
