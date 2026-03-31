import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

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
    });
  }

  async create(threadId: string, createCommentDto: CreateCommentDto) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    const authorEmail = process.env.COMMENT_AUTHOR_EMAIL ?? 'demo@fer.local';

    const author = await this.prisma.user.findUnique({
      where: { email: authorEmail },
      select: { id: true },
    });

    if (!author) {
      throw new ServiceUnavailableException(
        `Comment author user not found for email ${authorEmail}. Seed the database or set COMMENT_AUTHOR_EMAIL.`,
      );
    }

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        threadId,
        authorId: author.id,
      },
    });
  }
}
