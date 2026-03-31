import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@Controller('threads/:threadId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findByThreadId(@Param('threadId') threadId: string) {
    return this.commentsService.findByThreadId(threadId);
  }

  @Post()
  create(@Param('threadId') threadId: string, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(threadId, createCommentDto);
  }
}
