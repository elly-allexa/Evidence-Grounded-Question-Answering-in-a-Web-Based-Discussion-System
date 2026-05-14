import { Body, Controller, Param, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { TestAiDto } from './dto/test-ai.dto';
import { CreateAiAnswerDto } from './dto/create-ai-answer.dto';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('test')
  testPrompt(@Body() testAiDto: TestAiDto) {
    return this.aiService.testPrompt(testAiDto.prompt);
  }

  @Post('threads/:threadId/ai-answer')
  generateGroundedAnswer(
    @Param('threadId') threadId: string,
    @Body() createAiAnswerDto: CreateAiAnswerDto,
  ) {
    return this.aiService.generateGroundedAnswer(
      threadId,
      createAiAnswerDto.question,
      createAiAnswerDto.limit,
    );
  }
}
