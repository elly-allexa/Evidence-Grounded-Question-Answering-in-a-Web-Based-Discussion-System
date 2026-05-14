import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GroqProvider } from './providers/groq.provider';
import { RetrievalModule } from 'src/retrieval/retrieval.module';

@Module({
  imports: [RetrievalModule],
  controllers: [AiController],
  providers: [AiService, GroqProvider],
  exports: [AiService],
})
export class AiModule {}
