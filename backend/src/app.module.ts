import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/database/prisma.module';
import { HealthModule } from './health/health.module';
import { ThreadModule } from './threads/threads.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    ThreadModule,
    CommentsModule,
  ],
})
export class AppModule {}
