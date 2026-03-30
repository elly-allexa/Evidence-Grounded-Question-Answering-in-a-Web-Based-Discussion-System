import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';

const DEFAULT_THREAD_AUTHOR_EMAIL = 'demo@fer.local';

@Injectable()
export class ThreadService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createThreadDto: CreateThreadDto) {
    const authorEmail = process.env.THREAD_AUTHOR_EMAIL ?? DEFAULT_THREAD_AUTHOR_EMAIL;

    const author = await this.prisma.user.findUnique({
      where: { email: authorEmail },
      select: { id: true },
    });

    if (!author) {
      throw new ServiceUnavailableException(
        `Thread author user not found for email ${authorEmail}. Seed the database or set THREAD_AUTHOR_EMAIL.`,
      );
    }

    return this.prisma.thread.create({
      data: {
        title: createThreadDto.title,
        content: createThreadDto.content,
        authorId: author.id,
      },
    });
  }

  async findAll() {
    return this.prisma.thread.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${id} not found`);
    }
    return thread;
  }

  async update(id: string, updateThreadDto: UpdateThreadDto) {
    await this.findOne(id);

    return this.prisma.thread.update({
      where: { id },
      data: {
        ...(updateThreadDto.title !== undefined && { title: updateThreadDto.title }),
        ...(updateThreadDto.content !== undefined && { content: updateThreadDto.content }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.thread.delete({
      where: { id },
    });
  }
}
