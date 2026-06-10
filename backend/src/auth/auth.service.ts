import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/database/prisma.service';
import type { GoogleProfile } from './types';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile) {
    const isRootAdmin = this.isRootAdminEmail(profile.email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: isRootAdmin ? Role.ADMIN : existingUser.role,
        },
      });
    }

    const baseUsername = this.createUsernameFromEmail(profile.email);
    const username = await this.createUniqueUsername(baseUsername);

    return this.prisma.user.create({
      data: {
        email: profile.email,
        username,
        avatarUrl: null,
        role: isRootAdmin ? Role.ADMIN : Role.USER,
      },
    });
  }

  async createAccessToken(user: { id: string; email: string; username: string; role: Role }) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUsername && existingUsername.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username !== undefined && {
          username: dto.username.trim(),
        }),
        ...(dto.bio !== undefined && {
          bio: dto.bio.trim(),
        }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateAvatar(userId: string, filename: string) {
    const avatarUrl = `/uploads/avatars/${filename}`;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async deleteAvatar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
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

  private createUsernameFromEmail(email: string): string {
    const localPart = email.split('@')[0] ?? 'user';

    return localPart
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 30);
  }

  private async createUniqueUsername(baseUsername: string): Promise<string> {
    let candidate = baseUsername || 'user';
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      candidate = `${baseUsername}_${counter}`;
      counter += 1;
    }

    return candidate;
  }
}
