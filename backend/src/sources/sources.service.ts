import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourceChunkingService } from './chunking/source-chunking.service';
import { APP_LIMITS } from 'src/common/config/limits';
import { PdfTextExtractionService } from './pdf/pdf-text-extraction.service';
import { UploadPdfSourceDto } from './dto/upload-pdf-source.dto';

type UploadedPdfFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

const sourceInclude = {
  thread: {
    select: {
      id: true,
      title: true,
      authorId: true,
    },
  },
};

const REMOVED_SOURCE_TITLE = 'Removed source';
const REMOVED_SOURCE_MESSAGE =
  '[This source was removed by an administrator for moderation or security reasons.]';
const DEFAULT_DELETION_REASON =
  'This source was removed by an administrator for moderation or security reasons.';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sourceChunkingService: SourceChunkingService,
    private readonly pdfTextExtractionService: PdfTextExtractionService,
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

    const sources = await this.prisma.sourceDocument.findMany({
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

    return sources.map((source) =>
      source.isDeleted
        ? {
            ...source,
            title: REMOVED_SOURCE_TITLE,
            contentText: REMOVED_SOURCE_MESSAGE,
          }
        : source,
    );
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
      where: {
        threadId,
        isDeleted: false,
      },
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

  async createFromPdf(
    threadId: string,
    file: UploadedPdfFile | undefined,
    dto: UploadPdfSourceDto,
    currentUserId: string,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required.');
    }

    const extractedText = await this.pdfTextExtractionService.extractText(file.buffer);

    if (extractedText.length > APP_LIMITS.MAX_SOURCE_CONTENT_LENGTH) {
      throw new UnprocessableEntityException(
        `Extracted PDF text is too long. Maximum is ${APP_LIMITS.MAX_SOURCE_CONTENT_LENGTH} characters.`,
      );
    }

    const title = dto.title?.trim() || file.originalname.replace(/\.pdf$/i, '');

    return this.create(
      threadId,
      {
        title,
        type: 'pdf',
        contentText: extractedText,
      },
      currentUserId,
    );
  }

  async delete(sourceId: string, currentUserId: string, reason?: string) {
    const author = await this.getCurrentAuthor(currentUserId);

    const source = await this.prisma.sourceDocument.findUnique({
      where: { id: sourceId },
      include: sourceInclude,
    });

    if (!source) {
      throw new NotFoundException(`Source with id ${sourceId} not found`);
    }

    if (source.isDeleted) {
      throw new ConflictException('This source has already been removed.');
    }

    const isOwner = source.thread.authorId === author.id;
    const isAdmin = author.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only the thread author or an admin can delete attached sources',
      );
    }

    const aiAnswerCount = await this.prisma.aiAnswer.count({
      where: {
        threadId: source.thread.id,
      },
    });

    if (aiAnswerCount > 0 && !isAdmin) {
      throw new ForbiddenException(
        'Sources cannot be deleted after an AI answer has been generated.',
      );
    }

    if (aiAnswerCount > 0 && isAdmin) {
      return this.prisma.$transaction(async (tx) => {
        await tx.sourceChunk.deleteMany({
          where: {
            docId: source.id,
          },
        });

        const deletedSource = await tx.sourceDocument.update({
          where: { id: source.id },
          data: {
            title: REMOVED_SOURCE_TITLE,
            isDeleted: true,
            deletedAt: new Date(),
            deletedByAdminId: author.id,
            deletionReason: reason?.trim() || DEFAULT_DELETION_REASON,
            contentText: REMOVED_SOURCE_MESSAGE,
          },
          include: {
            _count: {
              select: {
                chunks: true,
              },
            },
          },
        });

        await tx.thread.update({
          where: { id: source.thread.id },
          data: {
            updatedAt: new Date(),
          },
        });

        return deletedSource;
      });
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
          isDeleted: false,
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
