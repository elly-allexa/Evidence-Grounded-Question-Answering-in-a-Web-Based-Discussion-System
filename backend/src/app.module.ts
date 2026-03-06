import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/database/prisma.module';
import { HealthModule } from './prisma/health/health.module';

@Module({
  imports: [PrismaModule, HealthModule],
})
export class AppModule {}
