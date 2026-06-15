import type {
  ConferenceDto,
  ConferenceEntityType,
} from '@/features/conference/api/conference-api.types';
import { useUpdateConferenceMutation } from '@/features/conference/hooks/mutations/use-update-conference-mutation';
import { useConferencesQuery } from '@/features/conference/hooks/queries/use-conferences-query';
import { formatConferenceScheduledFor } from '@/features/conference/lib/format-conference-time';
import { resolveFeaturedConference } from '@/features/conference/lib/resolve-featured-conference';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { useNavigate } from '@tanstack/react-router';
import { Calendar, Radio } from 'lucide-react';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type ConferenceBannerProps = {
  entityType: ConferenceEntityType;
  entityId: string;
  authorId: string;
  className?: string;
};

function navigateToConference(
  navigate: ReturnType<typeof useNavigate>,
  entityType: ConferenceEntityType,
  entityId: string,
  conference: ConferenceDto,
) {
  if (entityType === 'IDEA') {
    void navigate({
      to: '/ideas/$ideaId/conferences/$conferenceId',
      params: { ideaId: entityId, conferenceId: conference.id },
    });
    return;
  }

  void navigate({
    to: '/problems/$problemId/conferences/$conferenceId',
    params: { problemId: entityId, conferenceId: conference.id },
  });
}

export function ConferenceBanner({
  entityType,
  entityId,
  authorId,
  className,
}: ConferenceBannerProps) {
  const navigate = useNavigate();
  const entity = useMemo(
    () => ({ entityType, entityId }),
    [entityType, entityId],
  );
  const currentUserId = useAuthSessionStore(state => state.user?.id);
  const { data, isLoading } = useConferencesQuery(entity);
  const updateMutation = useUpdateConferenceMutation(entity);
  const featured = resolveFeaturedConference(data?.conferences ?? []);
  const conference = featured?.conference ?? null;

  const isAuthor = Boolean(currentUserId && currentUserId === authorId);

  if (isLoading) {
    return (
      <div
        className={cn(
          'border-brand-gray-200 bg-brand-gray-50 rounded-lg border px-4 py-3',
          className,
        )}
      >
        <p className="text-brand-gray-500 text-sm">Loading conferences...</p>
      </div>
    );
  }

  if (!featured || !conference) {
    return null;
  }

  const handleStartConference = () => {
    void updateMutation.mutateAsync({
      conferenceId: conference.id,
      action: 'start',
    });
  };

  const renderAuthorActions = () => {
    if (conference.status === 'SCHEDULED') {
      return (
        <Button
          type="button"
          className="bg-brand-orange hover:bg-brand-orange/90 w-full sm:w-auto"
          isLoading={updateMutation.isPending}
          onClick={handleStartConference}
        >
          Start conference
        </Button>
      );
    }

    if (conference.status === 'LIVE') {
      return (
        <Button
          type="button"
          className="bg-brand-orange hover:bg-brand-orange/90 w-full sm:w-auto"
          onClick={() =>
            navigateToConference(navigate, entityType, entityId, conference)
          }
        >
          Go to stage
        </Button>
      );
    }

    return null;
  };

  const renderListenerActions = () => {
    if (conference.status === 'SCHEDULED') {
      return (
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() =>
            navigateToConference(navigate, entityType, entityId, conference)
          }
        >
          Go to waiting room
        </Button>
      );
    }

    if (conference.status === 'LIVE') {
      return (
        <Button
          type="button"
          className="bg-brand-orange hover:bg-brand-orange/90 w-full sm:w-auto"
          onClick={() =>
            navigateToConference(navigate, entityType, entityId, conference)
          }
        >
          Join conference
        </Button>
      );
    }

    return null;
  };

  if (featured.kind === 'live') {
    return (
      <div
        className={cn(
          'border-brand-orange/30 bg-brand-orange/5 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          {!isAuthor ? (
            <span className="bg-emerald-500 mt-1 inline-flex shrink-0 animate-pulse rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
              Live now
            </span>
          ) : (
            <Radio className="text-brand-orange mt-0.5 size-4 shrink-0" />
          )}
          <div>
            {isAuthor ? (
              <p className="text-brand-orange text-xs font-semibold tracking-wide uppercase">
                Live now
              </p>
            ) : null}
            <p className="text-brand-dark-blue font-medium">
              {conference.title}
            </p>
          </div>
        </div>

        {isAuthor ? renderAuthorActions() : renderListenerActions()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-brand-gray-200 bg-brand-gray-50 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Calendar className="text-brand-gray-500 mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-brand-gray-600 text-xs font-semibold tracking-wide uppercase">
            Scheduled conference
          </p>
          <p className="text-brand-dark-blue font-medium">{conference.title}</p>
          <p className="text-brand-gray-500 text-sm">
            Scheduled for {formatConferenceScheduledFor(conference.scheduledFor)}
          </p>
        </div>
      </div>

      {isAuthor ? renderAuthorActions() : renderListenerActions()}
    </div>
  );
}
