import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/database/prisma.module';
import { HealthModule } from './prisma/health/health.module';
import { ThreadModule } from './threads/threads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    ThreadModule,
  ],
})
export class AppModule {}
