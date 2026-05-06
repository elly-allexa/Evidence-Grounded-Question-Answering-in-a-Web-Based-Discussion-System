import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourceChunkingService } from './chunking/source-chunking.service';

const DEFAULT_SOURCE_AUTHOR_EMAIL = 'demo@fer.local';

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

  private async getDemoAuthor(demoUserEmail?: string) {
    const authorEmail = demoUserEmail ?? process.env.DEMO_USER_EMAIL ?? DEFAULT_SOURCE_AUTHOR_EMAIL;

    const author = await this.prisma.user.findUnique({
      where: { email: authorEmail },
      select: {
        id: true,
        username: true,
      },
    });

    if (!author) {
      throw new NotFoundException(
        `Demo user not found for email ${authorEmail}. Seed the database or set DEMO_USER_EMAIL.`,
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

  async create(threadId: string, createSourceDto: CreateSourceDto, demoUserEmail?: string) {
    const author = await this.getDemoAuthor(demoUserEmail);

    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    if (thread.authorId !== author.id) {
      throw new ForbiddenException('Only the thread author can attach sources for now');
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

  async delete(sourceId: string, demoUserEmail?: string) {
    const author = await this.getDemoAuthor(demoUserEmail);

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
