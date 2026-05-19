import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
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

  @Get('threads/:threadId/ai-answers')
  findAnswersByThreadId(@Param('threadId') threadId: string) {
    return this.aiService.findAnswersByThreadId(threadId);
  }

  @Post('threads/:threadId/ai/answers')
  generateGroundedAnswer(
    @Param('threadId') threadId: string,
    @Body() createAiAnswerDto: CreateAiAnswerDto,
    @Headers('x-demo-user-email') demoUserEmail?: string,
  ) {
    return this.aiService.generateGroundedAnswer(
      threadId,
      createAiAnswerDto.question,
      createAiAnswerDto.limit,
      demoUserEmail,
    );
  }
}
