import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
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
    @Headers('x-demo-user-email') demoUserEmail: string | undefined,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(threadId, createCommentDto, demoUserEmail);
  }

  @Patch('comments/:commentId')
  update(
    @Param('commentId') commentId: string,
    @Headers('x-demo-user-email') demoUserEmail: string | undefined,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, updateCommentDto, demoUserEmail);
  }

  @Delete('comments/:commentId')
  delete(
    @Param('commentId') commentId: string,
    @Headers('x-demo-user-email') demoUserEmail: string | undefined,
  ) {
    return this.commentsService.delete(commentId, demoUserEmail);
  }
}
