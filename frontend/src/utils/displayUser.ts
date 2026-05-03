type DisplayableUser = {
  username?: string;
  isDeleted?: boolean;
};

export function getDisplayUsername(user?: DisplayableUser | null): string {
  if (!user) {
    return 'unknown';
  }

  if (user.isDeleted) {
    return 'deleted-user';
  }

  return user.username ?? 'unknown';
}
