import { Body, Controller, Get, Param, Post, Delete, Patch } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('threads/:threadId/comments')
  findByThreadId(@Param('threadId') threadId: string) {
    return this.commentsService.findByThreadId(threadId);
  }

  @Post('threads/:threadId/comments')
  create(
    @Param('threadId') threadId: string,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return this.commentsService.create(threadId, createCommentDto);
  }

  @Patch('comments/:commentId')
  update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto
  ) {
    return this.commentsService.update(commentId, updateCommentDto);
  }

  @Delete('comments/:commentId')
  delete(
    @Param('commentId') commentId: string
  ) {
    return this.commentsService.delete(commentId);
  }
}
