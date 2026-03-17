import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';

const DEMO_USER_EMAIL = 'demo@fer.local';

@Injectable()
export class ThreadService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createThreadDto: CreateThreadDto) {
    const demoUser = await this.prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
      select: { id: true },
    });

    if (!demoUser) {
      throw new ServiceUnavailableException(
        'Demo user is missing. Run the Prisma seed before creating threads.',
      );
    }

    return this.prisma.thread.create({
      data: {
        title: createThreadDto.title,
        content: createThreadDto.content,
        authorId: demoUser.id,
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
}
