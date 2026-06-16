import { getInitials } from '@/features/idea-details/lib/get-initials';

import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';

export type UserInviteCardState = 'idle' | 'invited' | 'loading' | 'disabled';

export type UserInviteCardProps = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  roleLabel: string;
  reason?: string;
  state?: UserInviteCardState;
  onInvite?: () => void;
  className?: string;
};

function inviteButtonLabel(state: UserInviteCardState): string {
  if (state === 'invited') {
    return 'INVITED';
  }

  if (state === 'loading') {
    return 'INVITING';
  }

  if (state === 'disabled') {
    return 'SPEAKER';
  }

  return 'INVITE';
}

export function UserInviteCard({
  userId,
  name,
  avatarUrl,
  roleLabel,
  reason,
  state = 'idle',
  onInvite,
  className,
}: UserInviteCardProps) {
  const isActionDisabled =
    state === 'invited' || state === 'loading' || state === 'disabled';

  return (
    <article
      className={cn(
        'border-brand-gray-200 bg-card flex h-full flex-col gap-4 rounded-lg border p-4',
        className,
      )}
      data-user-id={userId}
    >
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="ring-card ring-2">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-sm font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-brand-dark-blue truncate font-medium">{name}</p>
          <p className="text-brand-gray-500 text-sm">{roleLabel}</p>
          {reason ? (
            <p className="text-brand-gray-500 mt-1 text-xs">{reason}</p>
          ) : null}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        className={cn(
          'mt-auto w-full',
          state === 'idle' && 'bg-brand-orange hover:bg-brand-orange/90',
          state === 'invited' && 'bg-brand-gray-200 text-brand-gray-700',
        )}
        variant={state === 'idle' ? 'default' : 'outline'}
        disabled={isActionDisabled || !onInvite}
        isLoading={state === 'loading'}
        onClick={onInvite}
      >
        {inviteButtonLabel(state)}
      </Button>
    </article>
  );
}
