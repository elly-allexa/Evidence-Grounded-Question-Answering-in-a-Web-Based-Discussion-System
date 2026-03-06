import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  health() {
    return { ok: true };
  }

  @Get('db')
  async db() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, db: 'up' };
  }
}