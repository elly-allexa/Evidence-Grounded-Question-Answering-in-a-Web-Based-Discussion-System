type UserAvatarProps = {
  username: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

export function UserAvatar({ username, avatarUrl, size = 'sm' }: UserAvatarProps) {
  const src =
    avatarUrl && avatarUrl.startsWith('http')
      ? avatarUrl
      : avatarUrl
        ? `${import.meta.env.VITE_API_URL}${avatarUrl}`
        : null;
  const fallbackInitial = username.trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`user-avatar user-avatar--${size}`} aria-label={`${username} avatar`}>
      {src ? <img src={src} alt={`${username} avatar`} /> : <span>{fallbackInitial}</span>}
    </span>
  );
}
