import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
  ],
})
export class AppModule {}
