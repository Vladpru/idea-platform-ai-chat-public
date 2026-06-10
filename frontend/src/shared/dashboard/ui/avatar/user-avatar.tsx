import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { getInitials } from '@/features/idea-details/lib/get-initials';

type UserAvatarProps = {
  userId: string;
  avatarUrl: string | null | undefined;
  fullName: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

export function UserAvatar({
  userId,
  avatarUrl,
  fullName,
  size = 'default',
  className,
}: UserAvatarProps) {
  return (
    <Link
      to="/profile/$profileId"
      params={{ profileId: userId }}
      search={{ tab: 'all' }}
      className="focus-visible:ring-brand-dark-blue block shrink-0 rounded-full transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Avatar size={size} className={className}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
        <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 font-semibold">
          {getInitials(fullName)}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
