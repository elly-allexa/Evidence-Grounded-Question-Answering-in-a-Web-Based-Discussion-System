import { Body, Controller, Param, Post } from '@nestjs/common';
import { RetrieveChunksDto } from './dto/retrieve-chunks.dto';
import { RetrievalService } from './retrieval.service';

@Controller()
export class RetrievalController {
  constructor(private readonly retrievalService: RetrievalService) {}

  @Post('threads/:threadId/retrieve')
  retrieveForThread(
    @Param('threadId') threadId: string,
    @Body() retrieveChunksDto: RetrieveChunksDto,
  ) {
    return this.retrievalService.retrieveForThread(
      threadId,
      retrieveChunksDto.question,
      retrieveChunksDto.limit,
    );
  }
}
