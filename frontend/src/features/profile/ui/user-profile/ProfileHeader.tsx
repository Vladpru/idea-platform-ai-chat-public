import type { UserPublicProfile } from '@/features/profile/api/profile.api';
import { ProfileStartChatButton } from '@/features/profile/ui/ProfileStartChatButton';
import { ProfileStats } from '@/features/profile/ui/user-profile/ProfileStats';
import {
  outlineBtn,
  primaryBtn,
} from '@/features/profile/ui/shared/profile-view-classes';
import { formatUserDisplayName } from '@/shared/lib/user-display';
import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/shared/ui/dialog';
import {
  GithubIcon,
  LinkedinIcon,
  XIcon,
  YoutubeIcon,
} from '@/assets/svg/social-icons';
import { useNavigate } from '@tanstack/react-router';
import { Globe, Link as LinkIcon, X } from 'lucide-react';

type ProfileHeaderProps = {
  profile: UserPublicProfile;
  isOwner: boolean;
  isSubscriptionPending: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
};

type ActionButtonProps = {
  isOwner: boolean;
  isSubscriptionPending: boolean;
  isSubscribed: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  className?: string;
  navigate: ReturnType<typeof useNavigate>;
};

function formatSubscriberCount(count: number = 0): string {
  const safeCount = count ?? 0;
  const label = safeCount === 1 ? 'subscriber' : 'subscribers';
  return `${safeCount.toLocaleString()} ${label}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function SocialIcon({ url }: { url: string }) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('github.com'))
    return <GithubIcon className="text-foreground size-5" />;
  if (lowerUrl.includes('linkedin.com'))
    return <LinkedinIcon className="text-foreground size-5" />;
  if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com'))
    return <XIcon className="text-foreground size-5" />;
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be'))
    return <YoutubeIcon className="text-foreground size-5" />;
  return <Globe className="text-foreground size-5" />;
}

function getPlatformName(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('github.com')) return 'GitHub';
  if (lowerUrl.includes('linkedin.com')) return 'LinkedIn';
  if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com'))
    return 'X (Twitter)';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be'))
    return 'YouTube';
  if (lowerUrl.includes('twitch.tv')) return 'Twitch';
  if (lowerUrl.includes('instagram.com')) return 'Instagram';
  if (lowerUrl.includes('facebook.com')) return 'Facebook';

  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Website';
  }
}

function ActionButton({
  isOwner,
  isSubscriptionPending,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
  className,
  navigate,
  profileUserId,
}: ActionButtonProps & { profileUserId: string }) {
  if (isOwner) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(outlineBtn, 'cursor-pointer', className)}
        onClick={() =>
          navigate({ to: ROUTES.settings, search: { tab: 'account' } })
        }
      >
        Settings
      </Button>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row', className)}>
      <Button
        type="button"
        className={cn(
          isSubscribed ? outlineBtn : primaryBtn,
          'cursor-pointer sm:min-w-[120px]',
        )}
        disabled={isSubscriptionPending}
        onClick={isSubscribed ? onUnsubscribe : onSubscribe}
      >
        {isSubscriptionPending
          ? 'Updating...'
          : isSubscribed
            ? 'Unsubscribe'
            : 'Subscribe'}
      </Button>
      <ProfileStartChatButton
        userId={profileUserId}
        className="w-full sm:w-auto"
      />
    </div>
  );
}

export function ProfileHeader({
  profile,
  isOwner,
  isSubscriptionPending,
  onSubscribe,
  onUnsubscribe,
}: ProfileHeaderProps) {
  const navigate = useNavigate();
  const displayName = formatUserDisplayName({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
  });

  const safeSocialLinks = Array.isArray(profile.socialLinks)
    ? profile.socialLinks
    : [];

  return (
    <div className="mb-8 flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Avatar className="border-border size-16 shrink-0 border-2 sm:size-20">
              <AvatarImage
                src={profile.avatarUrl ?? undefined}
                alt={displayName}
              />
              <AvatarFallback className="bg-brand-light-blue text-brand-dark-blue text-lg font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-col">
              <h1 className="text-foreground truncate text-xl font-bold tracking-wide uppercase sm:text-3xl">
                {displayName}
              </h1>
              <p className="text-muted-foreground mt-0.5 text-xs font-semibold tracking-wide uppercase sm:text-sm">
                {formatSubscriberCount(profile.subscriberCount)}
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 sm:block">
            <ActionButton
              isOwner={isOwner}
              isSubscriptionPending={isSubscriptionPending}
              isSubscribed={profile.isSubscribed}
              onSubscribe={onSubscribe}
              onUnsubscribe={onUnsubscribe}
              navigate={navigate}
              profileUserId={profile.id}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {profile.bio && (
            <p className="text-foreground max-w-2xl text-sm leading-relaxed whitespace-pre-line opacity-90">
              {profile.bio}
            </p>
          )}

          {safeSocialLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
              <a
                href={safeSocialLinks[0]}
                target="_blank"
                rel="noreferrer noopener"
                className="group text-foreground hover:text-primary flex cursor-pointer items-center gap-1.5 transition-colors"
              >
                <LinkIcon className="text-foreground group-hover:text-primary size-4" />
                <span className="font-semibold hover:underline">
                  {getPlatformName(safeSocialLinks[0])}
                </span>
              </a>

              {safeSocialLinks.length > 1 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary cursor-pointer transition-colors hover:underline">
                      and {safeSocialLinks.length - 1} more links
                    </button>
                  </DialogTrigger>

                  <DialogContent className="border-border bg-card text-foreground shadow-soft w-[95vw] rounded-xl border p-6 sm:max-w-md">
                    <DialogHeader className="relative pr-6">
                      <DialogTitle className="text-foreground text-xl font-bold">
                        Links
                      </DialogTitle>

                      <DialogClose className="text-muted-foreground absolute -top-2 -right-2 cursor-pointer rounded-sm p-2 opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
                        <X className="size-5" />
                        <span className="sr-only">Close</span>
                      </DialogClose>
                    </DialogHeader>

                    <div className="mt-2 flex flex-col gap-3 py-2">
                      {safeSocialLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="hover:bg-muted flex cursor-pointer items-start gap-4 rounded-lg p-3 transition-colors"
                        >
                          <div className="bg-muted border-border flex size-10 shrink-0 items-center justify-center rounded-full border">
                            <SocialIcon url={link} />
                          </div>
                          <div className="flex min-w-0 flex-col pt-0.5">
                            <span className="text-foreground truncate text-sm font-bold">
                              {getPlatformName(link)}
                            </span>
                            <span className="text-primary dark:text-primary line-clamp-2 text-sm break-all hover:underline">
                              {link.replace(/^https?:\/\/(www\.)?/, '')}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        <div className="block sm:hidden">
          <ActionButton
            isOwner={isOwner}
            isSubscriptionPending={isSubscriptionPending}
            isSubscribed={profile.isSubscribed}
            onSubscribe={onSubscribe}
            onUnsubscribe={onUnsubscribe}
            className="w-full"
            navigate={navigate}
            profileUserId={profile.id}
          />
        </div>
      </div>

      <div className="flex justify-center sm:justify-start">
        <ProfileStats profileId={profile.id} />
      </div>
    </div>
  );
}
