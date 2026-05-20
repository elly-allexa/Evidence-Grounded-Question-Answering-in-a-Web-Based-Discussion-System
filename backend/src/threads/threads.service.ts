import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { APP_LIMITS } from 'src/common/config/limits';
import { ListThreadsDto } from './dto/list-threads.dto';

const DEFAULT_THREAD_AUTHOR_EMAIL = 'demo@fer.local';

const threadInclude = {
  author: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
  _count: {
    select: {
      comments: true,
      sources: true,
      aiAnswers: true,
    },
  },
};

@Injectable()
export class ThreadsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAuthorByEmail(demoUserEmail?: string) {
    const authorEmail =
      demoUserEmail ?? process.env.THREAD_AUTHOR_EMAIL ?? DEFAULT_THREAD_AUTHOR_EMAIL;

    const author = await this.prisma.user.findUnique({
      where: { email: authorEmail },
      select: { id: true },
    });

    if (!author) {
      throw new ServiceUnavailableException(
        `Thread author user not found for email ${authorEmail}. Seed the database or set THREAD_AUTHOR_EMAIL.`,
      );
    }

    return author;
  }

  async create(createThreadDto: CreateThreadDto, demoUserEmail?: string) {
    const author = await this.getAuthorByEmail(demoUserEmail);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayThreadCount = await this.prisma.thread.count({
      where: {
        authorId: author.id,
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    if (todayThreadCount >= APP_LIMITS.THREADS_PER_USER_PER_DAY) {
      throw new HttpException(
        `Daily thread limit reached. You can create at most ${APP_LIMITS.THREADS_PER_USER_PER_DAY} threads per day.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return this.prisma.thread.create({
      data: {
        title: createThreadDto.title,
        content: createThreadDto.content,
        authorId: author.id,
      },
      include: threadInclude,
    });
  }

  async findAll(query: ListThreadsDto = {}) {
    const search = query.search?.trim();
    const sort = query.sort ?? 'active';

    const take = Math.min(
      Math.max(query.limit ?? APP_LIMITS.DEFAULT_THREAD_PAGE_SIZE, 1),
      APP_LIMITS.MAX_THREAD_PAGE_SIZE,
    );

    const skip = Math.max(query.skip ?? 0, 0);

    const where = search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              content: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const orderBy =
      sort === 'popular'
        ? [
            {
              comments: {
                _count: 'desc' as const,
              },
            },
            {
              createdAt: 'desc' as const,
            },
          ]
        : sort === 'newest'
          ? [
              {
                createdAt: 'desc' as const,
              },
            ]
          : [
              {
                updatedAt: 'desc' as const,
              },
            ];

    return this.prisma.thread.findMany({
      where,
      orderBy,
      take,
      skip,
      include: threadInclude,
    });
  }

  async findOne(id: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      include: threadInclude,
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${id} not found`);
    }

    return thread;
  }

  async update(id: string, updateThreadDto: UpdateThreadDto, demoUserEmail?: string) {
    const author = await this.getAuthorByEmail(demoUserEmail);

    const thread = await this.prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${id} not found`);
    }

    if (thread.authorId !== author.id) {
      throw new ForbiddenException('You can edit only your own threads');
    }

    return this.prisma.thread.update({
      where: { id },
      data: {
        ...(updateThreadDto.title !== undefined && {
          title: updateThreadDto.title,
        }),
        ...(updateThreadDto.content !== undefined && {
          content: updateThreadDto.content,
        }),
      },
      include: threadInclude,
    });
  }

  async remove(id: string, demoUserEmail?: string) {
    const author = await this.getAuthorByEmail(demoUserEmail);

    const thread = await this.prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${id} not found`);
    }

    if (thread.authorId !== author.id) {
      throw new ForbiddenException('You can delete only your own threads');
    }

    return this.prisma.thread.delete({
      where: { id },
    });
  }
}
