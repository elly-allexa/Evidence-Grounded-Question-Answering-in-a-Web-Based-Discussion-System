import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourcesService } from './sources.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types';

@Controller()
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get('threads/:threadId/sources')
  findByThreadId(@Param('threadId') threadId: string) {
    return this.sourcesService.findByThreadId(threadId);
  }

  @Post('threads/:threadId/sources')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('threadId') threadId: string,
    @CurrentUser() user: JwtUser,
    @Body() createSourceDto: CreateSourceDto,
  ) {
    return this.sourcesService.create(threadId, createSourceDto, user.id);
  }

  @Delete('sources/:sourceId')
  @UseGuards(JwtAuthGuard)
  delete(@Param('sourceId') sourceId: string, @CurrentUser() user: JwtUser) {
    return this.sourcesService.delete(sourceId, user.id);
  }

  @Get('sources/:sourceId/chunks')
  getChunksBySourceId(@Param('sourceId') sourceId: string) {
    return this.sourcesService.findChunksBySourceId(sourceId);
  }

  @Get('threads/:threadId/chunks')
  getChunksByThreadId(@Param('threadId') threadId: string) {
    return this.sourcesService.findChunksByThreadId(threadId);
  }
}
