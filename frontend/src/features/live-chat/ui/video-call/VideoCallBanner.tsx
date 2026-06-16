import type { VideoCallDto } from '@/features/live-chat/api/live-chat-api.types';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { useCreateVideoCallMutation } from '@/features/live-chat/hooks/mutations/use-create-video-call-mutation';
import { useUpdateVideoCallMutation } from '@/features/live-chat/hooks/mutations/use-update-video-call-mutation';
import { useVideoCallsQuery } from '@/features/live-chat/hooks/queries/use-video-calls-query';
import { formatVideoCallScheduledFor } from '@/features/live-chat/lib/format-live-chat-time';
import { Calendar, Phone } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type VideoCallBannerProps = {
  roomId: string;
  isInCall: boolean;
  joinedCallId: string | null;
  onJoinCall: (callId: string) => Promise<void>;
  onLeaveCall: () => void;
  onScheduleOpen: () => void;
  className?: string;
};

function isHost(call: VideoCallDto, userId: string | undefined): boolean {
  return Boolean(userId && call.host.id === userId);
}

export function VideoCallBanner({
  roomId,
  isInCall,
  joinedCallId,
  onJoinCall,
  onLeaveCall,
  onScheduleOpen,
  className,
}: VideoCallBannerProps) {
  const currentUserId = useAuthSessionStore(state => state.user?.id);
  const { data: calls, isLoading } = useVideoCallsQuery(roomId);
  const createCallMutation = useCreateVideoCallMutation(roomId);
  const updateCallMutation = useUpdateVideoCallMutation(roomId);

  const activeCall = calls?.activeCall ?? null;
  const upcomingCalls = calls?.upcomingCalls ?? [];

  const handleStartNow = async () => {
    const call = await createCallMutation.mutateAsync({});
    await onJoinCall(call.id);
  };

  const handleStartScheduled = async (callId: string) => {
    await updateCallMutation.mutateAsync({ callId, action: 'start' });
    await onJoinCall(callId);
  };

  const handleEndCall = async (callId: string) => {
    await updateCallMutation.mutateAsync({ callId, action: 'end' });
    if (joinedCallId === callId) {
      onLeaveCall();
    }
  };

  const handleCancelScheduled = async (callId: string) => {
    await updateCallMutation.mutateAsync({ callId, action: 'cancel' });
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900',
          className,
        )}
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading video calls...
        </p>
      </div>
    );
  }

  if (isInCall && activeCall && joinedCallId === activeCall.id) {
    return null;
  }

  if (activeCall) {
    return (
      <div
        className={cn(
          'border-brand-orange/30 bg-brand-orange/5 mb-4 flex flex-col gap-3 rounded-lg border px-4 py-3',
          className,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-brand-orange h-2 w-2 animate-pulse rounded-full" />
            <p className="text-brand-dark-blue text-sm font-medium">
              Call in progress
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-brand-orange hover:bg-brand-orange/90"
              isLoading={updateCallMutation.isPending}
              onClick={() => void onJoinCall(activeCall.id)}
            >
              Join
            </Button>
            {isHost(activeCall, currentUserId) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={updateCallMutation.isPending}
                onClick={() => void handleEndCall(activeCall.id)}
              >
                End call
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          upcomingCalls.length > 0 && 'border-b border-zinc-200 pb-3 dark:border-zinc-800',
        )}
      >
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Start a video call
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-brand-orange hover:bg-brand-orange/90"
            isLoading={createCallMutation.isPending}
            onClick={() => void handleStartNow()}
          >
            Start now
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Calendar className="h-4 w-4" />}
            onClick={onScheduleOpen}
          >
            Schedule
          </Button>
        </div>
      </div>

      {upcomingCalls.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Upcoming video calls
          </p>
          {upcomingCalls.map(call => (
            <div
              key={call.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <p className="text-sm text-zinc-900 dark:text-zinc-50">
                  Scheduled for{' '}
                  <span className="font-medium">
                    {call.scheduledFor
                      ? formatVideoCallScheduledFor(call.scheduledFor)
                      : 'TBD'}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={updateCallMutation.isPending}
                  onClick={() => void handleStartScheduled(call.id)}
                >
                  Start now
                </Button>
                {isHost(call, currentUserId) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    isLoading={updateCallMutation.isPending}
                    onClick={() => void handleCancelScheduled(call.id)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
