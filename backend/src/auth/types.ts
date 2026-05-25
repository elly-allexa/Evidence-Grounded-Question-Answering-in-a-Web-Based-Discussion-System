export type JwtUser = {
  id: string;
  email: string;
  username: string;
};

export type GoogleProfile = {
  email: string;
  displayName: string;
  avatarUrl?: string;
};
