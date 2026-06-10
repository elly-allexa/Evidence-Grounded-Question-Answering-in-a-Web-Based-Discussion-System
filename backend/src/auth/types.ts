import { Role } from '@prisma/client';

export type JwtUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
};

export type GoogleProfile = {
  email: string;
  displayName: string;
  avatarUrl?: string;
};
