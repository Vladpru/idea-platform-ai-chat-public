import { nameInitial } from '@/features/auth';
import type { UserPublic } from '@/features/profile/api/profile.api';
import { fetchHasPassword } from '@/features/profile/api/profile.api';
import { ChangePasswordModal } from '@/features/profile/ui/ChangePasswordModal';
import {
  outlineBtn,
  primaryBtn,
} from '@/features/profile/ui/profile-view-classes';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';

type ProfileDisplayPanelProps = {
  user: UserPublic;
  displayName: string;
  onEdit: () => void;
};

export function ProfileDisplayPanel({
  user,
  displayName,
  onEdit,
}: ProfileDisplayPanelProps) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { data: hasPassword } = useQuery({
    queryKey: ['users', 'me', 'has-password'],
    queryFn: fetchHasPassword,
  });

  const safeSocialLinks = Array.isArray(user?.socialLinks)
    ? user.socialLinks
    : [];
  const visibleSocialLinks = safeSocialLinks.filter(
    link => link && link.trim().length > 0,
  );

  return (
    <div className="mt-8 flex flex-col gap-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            key={user?.avatarUrl ?? 'no-avatar'}
            size="xl"
            className="size-20 shrink-0"
          >
            <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-lg font-semibold">
              {nameInitial(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-brand-gray-900 text-lg font-bold">
              {displayName}
            </p>
            <p className="text-brand-gray-600 dark:text-muted-foreground mt-1 text-sm">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className={cn(primaryBtn, 'min-w-36')}
            onClick={onEdit}
          >
            Edit profile
          </Button>
          {hasPassword ? (
            <Button
              type="button"
              variant="outline"
              className={cn(outlineBtn, 'min-w-36')}
              onClick={() => setPasswordOpen(true)}
            >
              Change password
            </Button>
          ) : null}
        </div>
      </div>

      {user?.bio?.trim() ? (
        <p className="text-brand-gray-700 dark:text-muted-foreground max-w-2xl text-sm leading-relaxed whitespace-pre-line">
          {user.bio}
        </p>
      ) : null}

      {visibleSocialLinks.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {visibleSocialLinks.map(link => (
            <li key={link}>
              <a
                href={link}
                target="_blank"
                rel="noreferrer noopener"
                className="text-brand-dark-blue text-sm font-medium hover:underline"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {hasPassword ? (
        <ChangePasswordModal
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
        />
      ) : null}
    </div>
  );
}
