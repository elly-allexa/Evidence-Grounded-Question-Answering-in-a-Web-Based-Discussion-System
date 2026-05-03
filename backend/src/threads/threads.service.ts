import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';

const DEFAULT_THREAD_AUTHOR_EMAIL = 'demo@fer.local';

const threadAuthorInclude = {
  author: {
    select: {
      id: true,
      username: true,
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

    return this.prisma.thread.create({
      data: {
        title: createThreadDto.title,
        content: createThreadDto.content,
        authorId: author.id,
      },
      include: threadAuthorInclude,
    });
  }

  async findAll() {
    return this.prisma.thread.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: threadAuthorInclude,
    });
  }

  async findOne(id: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      include: threadAuthorInclude,
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
      include: threadAuthorInclude,
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
