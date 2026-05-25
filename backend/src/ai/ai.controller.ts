import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { TestAiDto } from './dto/test-ai.dto';
import { CreateAiAnswerDto } from './dto/create-ai-answer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types';

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
  @UseGuards(JwtAuthGuard)
  generateGroundedAnswer(
    @Param('threadId') threadId: string,
    @Body() createAiAnswerDto: CreateAiAnswerDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.aiService.generateGroundedAnswer(
      threadId,
      createAiAnswerDto.question,
      createAiAnswerDto.limit,
      user.id,
    );
  }
}
