import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/database/prisma.module';
import { HealthModule } from './health/health.module';
import { ThreadsModule } from './threads/threads.module';
import { CommentsModule } from './comments/comments.module';
import { SourcesModule } from './sources/sources.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    PrismaModule,
    HealthModule,
    ThreadsModule,
    CommentsModule,
    SourcesModule,
    RetrievalModule,
    AiModule,
    AuthModule,
    NotificationsModule,
    AdminModule,
    UsersModule,
  ],
})
export class AppModule {}
