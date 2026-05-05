import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourcesService } from './sources.service';

@Controller()
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get('threads/:threadId/sources')
  findByThreadId(@Param('threadId') threadId: string) {
    return this.sourcesService.findByThreadId(threadId);
  }

  @Post('threads/:threadId/sources')
  create(
    @Param('threadId') threadId: string,
    @Headers('x-demo-user-email') demoUserEmail: string | undefined,
    @Body() createSourceDto: CreateSourceDto,
  ) {
    return this.sourcesService.create(threadId, createSourceDto, demoUserEmail);
  }

  @Delete('sources/:sourceId')
  delete(
    @Param('sourceId') sourceId: string,
    @Headers('x-demo-user-email') demoUserEmail: string | undefined,
  ) {
    return this.sourcesService.delete(sourceId, demoUserEmail);
  }
}
