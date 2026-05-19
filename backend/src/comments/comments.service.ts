import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const DEFAULT_COMMENT_AUTHOR_EMAIL = 'demo@fer.local';

const commentInclude = {
  author: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
};

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

  private async cleanupDeletedParentChain(
    tx: Prisma.TransactionClient,
    parentId: string | null,
  ) {
    let currentParentId = parentId;

    while (currentParentId) {
      const parent = await tx.comment.findUnique({
        where: { id: currentParentId },
        select: {
          id: true,
          parentId: true,
          isDeleted: true,
        },
      });

      if (!parent || !parent.isDeleted) {
        break;
      }

      const childCount = await tx.comment.count({
        where: {
          parentId: parent.id,
        },
      });

      if (childCount > 0) {
        break;
      }

      await tx.comment.delete({
        where: { id: parent.id },
      });

      currentParentId = parent.parentId;
    }
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
      include: commentInclude,
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

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          threadId,
          authorId: author.id,
          content: createCommentDto.content,
          parentId: createCommentDto.parentId ?? null,
        },
        include: commentInclude,
      });

      await tx.thread.update({
        where: { id: threadId },
        data: {
          updatedAt: new Date(),
        },
      });

      return comment;
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

    return this.prisma.$transaction(async (tx) => {
      const updatedComment = await tx.comment.update({
        where: { id: commentId },
        data: {
          ...(updateCommentDto.content !== undefined && {
            content: updateCommentDto.content,
          }),
        },
        include: commentInclude,
      });

      await tx.thread.update({
        where: { id: comment.threadId },
        data: {
          updatedAt: new Date(),
        },
      });

      return updatedComment;
    });
  }

  async delete(commentId: string, demoUserEmail?: string) {
    const author = await this.getDemoAuthor(demoUserEmail);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }

    if (comment.authorId !== author.id) {
      throw new ForbiddenException('You can delete only your own comments');
    }

    const childCount = await this.prisma.comment.count({
      where: {
        parentId: commentId,
      },
    });

    return this.prisma.$transaction(async (tx) => {
      if (childCount > 0) {
        const softDeleted = await tx.comment.update({
          where: { id: commentId },
          data: {
            content: '[deleted]',
            isDeleted: true,
          },
          include: commentInclude,
        });

        await tx.thread.update({
          where: { id: comment.threadId },
          data: {
            updatedAt: new Date(),
          },
        });

        return {
          mode: 'soft',
          comment: softDeleted,
        };
      }

      const parentId = comment.parentId;

      await tx.comment.delete({
        where: { id: commentId },
      });

      await this.cleanupDeletedParentChain(tx, parentId);

      await tx.thread.update({
        where: { id: comment.threadId },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        mode: 'hard',
        deletedCommentId: commentId,
      };
    });
  }
}
