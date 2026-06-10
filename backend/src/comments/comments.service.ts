import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType, Prisma, Role } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getCurrentAuthor(userId: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    if (!author) {
      throw new ServiceUnavailableException('Current user not found');
    }

    return author;
  }

  private async cleanupDeletedParentChain(
    tx: Prisma.TransactionClient,
    parentId: string | null,
  ): Promise<string[]> {
    const deletedIds: string[] = [];
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

      deletedIds.push(parent.id);

      currentParentId = parent.parentId;
    }

    return deletedIds;
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

  async create(threadId: string, createCommentDto: CreateCommentDto, currentUserId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    const author = await this.getCurrentAuthor(currentUserId);

    let parentComment: any = null;

    if (createCommentDto.parentId) {
      parentComment = await this.prisma.comment.findUnique({
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

    const createdComment = await this.prisma.$transaction(async (tx) => {
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

    if (thread.authorId !== author.id) {
      await this.notificationsService.create({
        userId: thread.authorId,
        type: NotificationType.THREAD_COMMENT,
        title: 'New comment on your thread',
        message: `${author.username} commented on your thread.`,
        link: `/threads/${threadId}`,
      });
    }

    if (
      createCommentDto.parentId &&
      parentComment &&
      parentComment.authorId !== author.id &&
      parentComment.authorId !== thread.authorId
    ) {
      await this.notificationsService.create({
        userId: parentComment.authorId,
        type: NotificationType.COMMENT_REPLY,
        title: 'New reply to your comment',
        message: `${author.username} replied to your comment.`,
        link: `/threads/${threadId}`,
      });
    }

    return createdComment;
  }

  async update(commentId: string, updateCommentDto: UpdateCommentDto, currentUserId: string) {
    const author = await this.getCurrentAuthor(currentUserId);

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

  async delete(commentId: string, currentUserId: string) {
    const author = await this.getCurrentAuthor(currentUserId);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }

    const isOwner = comment.authorId === author.id;
    const isAdmin = author.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
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

      const cleanedParentIds = await this.cleanupDeletedParentChain(tx, parentId);

      await tx.thread.update({
        where: { id: comment.threadId },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        mode: 'hard',
        deletedCommentIds: [commentId, ...cleanedParentIds],
      };
    });
  }
}
