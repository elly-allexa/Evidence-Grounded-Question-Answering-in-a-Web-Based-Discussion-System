import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('threads/:threadId/comments')
  findByThreadId(@Param('threadId') threadId: string) {
    return this.commentsService.findByThreadId(threadId);
  }

  @Post('threads/:threadId/comments')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('threadId') threadId: string,
    @CurrentUser() user: JwtUser,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(threadId, createCommentDto, user.id);
  }

  @Patch('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtUser,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, updateCommentDto, user.id);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  delete(@Param('commentId') commentId: string, @CurrentUser() user: JwtUser) {
    return this.commentsService.delete(commentId, user.id);
  }
}
