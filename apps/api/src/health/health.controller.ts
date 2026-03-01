import { Controller, Get, Inject } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(getConnectionToken())
    private readonly sequelize: Sequelize,
  ) {}

  @Get()
  async check() {
    try {
      await this.sequelize.authenticate();
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      return {
        status: 'error',
        database: 'disconnected',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
