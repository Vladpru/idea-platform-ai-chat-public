import { useJoinVideoCallMutation } from '@/features/live-chat/hooks/mutations/use-join-video-call-mutation';
import { useLiveChatRoomQuery } from '@/features/live-chat/hooks/queries/use-live-chat-room-query';
import { LiveChatTeamAvatars } from '@/features/live-chat/ui/room/LiveChatTeamAvatars';
import {
  LiveChatCallLayout,
  type VideoSessionState,
} from '@/features/live-chat/ui/video-call/LiveChatCallLayout';
import { ScheduleVideoCallDialog } from '@/features/live-chat/ui/video-call/ScheduleVideoCallDialog';
import { VideoCallBanner } from '@/features/live-chat/ui/video-call/VideoCallBanner';
import { cn } from '@/shared/lib/utils';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type LiveChatRoomPageProps = {
  roomId: string;
};

export function LiveChatRoomPage({ roomId }: LiveChatRoomPageProps) {
  const { data: room, isLoading, isError } = useLiveChatRoomQuery(roomId);
  const joinCallMutation = useJoinVideoCallMutation(roomId);

  const [videoSession, setVideoSession] = useState<VideoSessionState | null>(
    null,
  );
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'video' | 'chat'>('video');
  const reconnectingRef = useRef(false);
  const videoSessionRef = useRef<VideoSessionState | null>(null);

  useEffect(() => {
    videoSessionRef.current = videoSession;
  });

  const handleJoinCall = useCallback(
    async (callId: string) => {
      const response = await joinCallMutation.mutateAsync(callId);
      setVideoSession({
        callId: response.call.id,
        token: response.token,
        livekitUrl: response.livekitUrl,
      });
      setMobileTab('video');
    },
    [joinCallMutation],
  );

  const handleLeaveVideo = useCallback(() => {
    setVideoSession(null);
    setMobileTab('chat');
  }, []);

  const handleConnectionLost = useCallback(async () => {
    const session = videoSessionRef.current;

    if (!session) {
      return;
    }

    if (reconnectingRef.current) {
      toast.error('Video call disconnected. Please join again.');
      setVideoSession(null);
      setMobileTab('chat');
      return;
    }

    reconnectingRef.current = true;
    toast.message('Connection lost. Attempting to reconnect...');

    try {
      const response = await joinCallMutation.mutateAsync(session.callId);
      setVideoSession({
        callId: response.call.id,
        token: response.token,
        livekitUrl: response.livekitUrl,
      });
      setMobileTab('video');
      toast.success('Reconnected to the video call');
    } catch {
      toast.error('Could not reconnect. Please join the call again.');
      setVideoSession(null);
      setMobileTab('chat');
    } finally {
      reconnectingRef.current = false;
    }
  }, [joinCallMutation]);

  return (
    <div
      className={cn(
        'mx-auto flex flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950',
        videoSession !== null ? 'w-[95vw] max-w-[1600px]' : 'w-full max-w-5xl',
      )}
    >
      <div className="shrink-0 px-6 pt-6 pb-4 md:px-10 md:pt-10">
        <Link
          to=".."
          className="text-brand-dark-blue inline-flex w-fit items-center text-sm font-medium hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Live Chats
        </Link>
      </div>

      {isLoading && (
        <p className="text-brand-gray-500 px-6 text-sm md:px-10">
          Loading chat room...
        </p>
      )}

      {isError || !room ? (
        <p className="text-brand-orange px-6 text-sm md:px-10">
          This live chat room could not be found.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-6 pb-4 md:px-10">
            <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-brand-gray-500 text-sm tracking-wide uppercase">
                  Live chat
                </p>
                <h1 className="text-brand-dark-blue text-2xl font-bold">
                  {room.entity.title ?? 'Untitled'}
                </h1>
                {room.entity.type === 'users' ? (
                  <Link
                    to="/profile/$profileId"
                    params={{ profileId: room.entity.id }}
                    search={{ tab: 'all' }}
                    className="text-brand-orange mt-2 inline-block text-sm hover:underline"
                  >
                    View profile
                  </Link>
                ) : (
                  <Link
                    to={
                      room.entity.type === 'ideas'
                        ? '/ideas/$ideaId'
                        : '/problems/$problemId'
                    }
                    params={
                      room.entity.type === 'ideas'
                        ? { ideaId: room.entity.id }
                        : { problemId: room.entity.id }
                    }
                    search={{}}
                    className="text-brand-orange mt-2 inline-block text-sm hover:underline"
                  >
                    View {room.entity.type === 'ideas' ? 'idea' : 'problem'}
                  </Link>
                )}
              </div>

              <LiveChatTeamAvatars
                team={room.team ?? []}
                className="self-start"
              />
            </header>

            <VideoCallBanner
              roomId={room.id}
              isInCall={videoSession !== null}
              joinedCallId={videoSession?.callId ?? null}
              onJoinCall={handleJoinCall}
              onLeaveCall={handleLeaveVideo}
              onScheduleOpen={() => setScheduleOpen(true)}
            />
          </div>

          <ScheduleVideoCallDialog
            roomId={room.id}
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
          />

          <LiveChatCallLayout
            roomId={room.id}
            videoSession={videoSession}
            onLeaveVideo={handleLeaveVideo}
            onConnectionLost={() => void handleConnectionLost()}
            mobileTab={mobileTab}
            onMobileTabChange={setMobileTab}
            isDm={room.entity.type === 'users'}
          />
        </div>
      )}
    </div>
  );
}
