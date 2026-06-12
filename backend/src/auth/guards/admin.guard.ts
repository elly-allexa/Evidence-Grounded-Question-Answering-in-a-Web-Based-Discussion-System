import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/database/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Admin access required');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!dbUser) {
      throw new ForbiddenException('Admin access required');
    }

    const isRootAdmin = this.isRootAdminEmail(dbUser.email);
    const isAdmin = dbUser.role === Role.ADMIN;

    if (!isRootAdmin && !isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
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
