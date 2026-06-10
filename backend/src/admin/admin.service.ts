import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findUsers(query: ListAdminUsersDto) {
    const search = query.search?.trim().replace(/\s+/g, ' ');
    const take = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const skip = Math.max(query.skip ?? 0, 0);

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            {
              username: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [
          {
            role: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take,
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          bio: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              threads: true,
              comments: true,
              aiJobs: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      total,
      users: users.map((user) => ({
        ...user,
        isRootAdmin: this.isRootAdminEmail(user.email),
      })),
    };
  }

  async updateUserRole(targetUserId: string, dto: UpdateUserRoleDto, currentAdminId: string) {
    const currentAdmin = await this.prisma.user.findUnique({
      where: { id: currentAdminId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!currentAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    const currentUserIsAdmin =
      currentAdmin.role === Role.ADMIN || this.isRootAdminEmail(currentAdmin.email);

    if (!currentUserIsAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (this.isRootAdminEmail(targetUser.email) && dto.role !== 'ADMIN') {
      throw new BadRequestException('Protected root admin cannot be demoted');
    }

    if (targetUser.id === currentAdmin.id && dto.role !== 'ADMIN') {
      throw new BadRequestException('You cannot remove your own admin role');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: dto.role === 'ADMIN' ? Role.ADMIN : Role.USER,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            threads: true,
            comments: true,
            aiJobs: true,
          },
        },
      },
    });
  }

  private isRootAdminEmail(email: string): boolean {
    const adminEmails = process.env.ADMIN_EMAILS ?? '';

    return adminEmails
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .includes(email.toLowerCase());
  }
}