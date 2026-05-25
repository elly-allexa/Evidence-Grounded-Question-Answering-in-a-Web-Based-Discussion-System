import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourceChunkingService } from './chunking/source-chunking.service';
import { APP_LIMITS } from 'src/common/config/limits';

const sourceInclude = {
  thread: {
    select: {
      id: true,
      title: true,
      authorId: true,
    },
  },
};

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sourceChunkingService: SourceChunkingService,
  ) {}

  private async getCurrentAuthor(userId: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
      },
    });

    if (!author) {
      throw new NotFoundException('Current user not found');
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

    return this.prisma.sourceDocument.findMany({
      where: { threadId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });
  }

  async create(threadId: string, createSourceDto: CreateSourceDto, currentUserId: string) {
    const author = await this.getCurrentAuthor(currentUserId);

    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    if (thread.authorId !== author.id) {
      throw new ForbiddenException('Only the thread author can attach sources for now');
    }

    const sourceCount = await this.prisma.sourceDocument.count({
      where: { threadId },
    });

    if (sourceCount >= APP_LIMITS.MAX_SOURCES_PER_THREAD) {
      throw new ConflictException(
        `A thread can have at most ${APP_LIMITS.MAX_SOURCES_PER_THREAD} evidence sources.`,
      );
    }

    const chunks = this.sourceChunkingService.splitIntoChunks(createSourceDto.contentText);

    return this.prisma.$transaction(async (tx) => {
      const source = await tx.sourceDocument.create({
        data: {
          threadId,
          title: createSourceDto.title,
          type: createSourceDto.type,
          contentText: createSourceDto.contentText,
        },
        include: {
          _count: {
            select: {
              chunks: true,
            },
          },
        },
      });

      if (chunks.length > 0) {
        await tx.sourceChunk.createMany({
          data: chunks.map((chunkText, index) => ({
            docId: source.id,
            chunkIndex: index,
            text: chunkText,
          })),
        });
      }

      await tx.thread.update({
        where: { id: threadId },
        data: {
          updatedAt: new Date(),
        },
      });

      return tx.sourceDocument.findUniqueOrThrow({
        where: { id: source.id },
        include: {
          _count: {
            select: {
              chunks: true,
            },
          },
        },
      });
    });
  }

  async delete(sourceId: string, currentUserId: string) {
    const author = await this.getCurrentAuthor(currentUserId);

    const source = await this.prisma.sourceDocument.findUnique({
      where: { id: sourceId },
      include: sourceInclude,
    });

    if (!source) {
      throw new NotFoundException(`Source with id ${sourceId} not found`);
    }

    if (source.thread.authorId !== author.id) {
      throw new ForbiddenException('Only the thread author can delete attached sources');
    }

    const aiAnswerCount = await this.prisma.aiAnswer.count({
      where: {
        threadId: source.thread.id,
      },
    });

    if (aiAnswerCount > 0) {
      throw new ForbiddenException(
        'Sources cannot be deleted after an AI answer has been generated.',
      );
    }

    return this.prisma.sourceDocument.delete({
      where: { id: sourceId },
    });
  }

  async findChunksBySourceId(sourceId: string) {
    const source = await this.prisma.sourceDocument.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new NotFoundException(`Source with id ${sourceId} not found`);
    }

    return this.prisma.sourceChunk.findMany({
      where: { docId: sourceId },
      orderBy: {
        chunkIndex: 'asc',
      },
    });
  }

  async findChunksByThreadId(threadId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    return this.prisma.sourceChunk.findMany({
      where: {
        doc: {
          threadId,
        },
      },
      orderBy: [
        {
          docId: 'asc',
        },
        {
          chunkIndex: 'asc',
        },
      ],
      include: {
        doc: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }
}
