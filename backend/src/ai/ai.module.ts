import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GroqProvider } from './providers/groq.provider';
import { RetrievalModule } from 'src/retrieval/retrieval.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AiProcessor } from './ai.processor';

@Module({
  imports: [
    RetrievalModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'ai',
    }),
  ],
  controllers: [AiController],
  providers: [AiService, GroqProvider, AiProcessor],
  exports: [AiService],
})
export class AiModule {}
