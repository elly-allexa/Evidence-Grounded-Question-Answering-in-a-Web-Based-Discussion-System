import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GroqProvider } from './providers/groq.provider';

@Module({
  controllers: [AiController],
  providers: [AiService, GroqProvider],
  exports: [AiService],
})
export class AiModule {}
