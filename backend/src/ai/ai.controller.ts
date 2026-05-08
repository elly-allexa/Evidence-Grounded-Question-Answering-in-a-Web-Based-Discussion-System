import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { TestAiDto } from './dto/test-ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('test')
  testPrompt(@Body() testAiDto: TestAiDto) {
    return this.aiService.testPrompt(testAiDto.prompt);
  }
}
