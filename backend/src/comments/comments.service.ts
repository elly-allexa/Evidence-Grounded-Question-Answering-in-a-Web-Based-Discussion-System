import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const DEFAULT_COMMENT_AUTHOR_EMAIL = 'demo@fer.local';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDemoAuthor(demoUserEmail?: string) {
    const authorEmail =
      demoUserEmail ?? process.env.DEMO_USER_EMAIL ?? DEFAULT_COMMENT_AUTHOR_EMAIL;

    const author = await this.prisma.user.findUnique({
      where: { email: authorEmail },
      select: {
        id: true,
        username: true,
      },
    });

    if (!author) {
      throw new ServiceUnavailableException(
        `Comment author user not found for email ${authorEmail}. Seed the database or set DEMO_USER_EMAIL.`,
      );
    }

    return author;
  }

  async findByThreadId(threadId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    return this.prisma.comment.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async create(threadId: string, createCommentDto: CreateCommentDto, demoUserEmail?: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    const author = await this.getDemoAuthor(demoUserEmail);

    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(
          `Parent comment with id ${createCommentDto.parentId} not found`,
        );
      }

      if (parentComment.threadId !== threadId) {
        throw new ForbiddenException('Parent comment does not belong to the same thread');
      }
    }

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        threadId,
        authorId: author.id,
        parentId: createCommentDto.parentId ?? null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async update(commentId: string, updateCommentDto: UpdateCommentDto, demoUserEmail?: string) {
    const author = await this.getDemoAuthor(demoUserEmail);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }

    if (comment.authorId !== author.id) {
      throw new ForbiddenException('You can edit only your own comments');
    }

    if (comment.isDeleted) {
      throw new ForbiddenException('You cannot edit a deleted comment');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(updateCommentDto.content !== undefined && {
          content: updateCommentDto.content,
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async delete(commentId: string, demoUserEmail?: string) {
    const author = await this.getDemoAuthor(demoUserEmail);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        replies: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }

    if (comment.authorId !== author.id) {
      throw new ForbiddenException('You can delete only your own comments');
    }

    if (comment.replies.length > 0) {
      return this.prisma.comment.update({
        where: { id: commentId },
        data: {
          content: '[deleted]',
          isDeleted: true,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    }

    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
