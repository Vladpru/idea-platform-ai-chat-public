import {
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';
import {
  Heart,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Pin,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/shared/lib/utils';

const REACTION_LIKE = 'REACTION:LIKE';

function useLikes() {
  const room = useRoomContext();
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      if (new TextDecoder().decode(payload) === REACTION_LIKE) {
        setCount(c => c + 1);
        setBump(true);
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  useEffect(() => {
    if (!bump) return;
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [bump]);

  const sendLike = useCallback(() => {
    void room.localParticipant.publishData(
      new TextEncoder().encode(REACTION_LIKE),
      { reliable: false },
    );
    setCount(c => c + 1);
    setBump(true);
  }, [room]);

  return { count, bump, sendLike };
}

function gridColsClass(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count <= 4) return 'grid-cols-2';
  return 'grid-cols-3';
}

function TileWithPinButton({
  track,
  isPinned,
  onPin,
  className,
}: {
  track: TrackReferenceOrPlaceholder;
  isPinned: boolean;
  onPin: () => void;
  className?: string;
}) {
  return (
    <div className={cn('group relative overflow-hidden rounded-lg', className)}>
      <ParticipantTile trackRef={track} className="h-full w-full" />
      <button
        type="button"
        onClick={onPin}
        className={cn(
          'absolute right-2 top-2 z-20 cursor-pointer rounded-md p-1.5 transition-all pointer-events-auto',
          isPinned
            ? 'bg-brand-orange text-white'
            : 'bg-black/40 text-white opacity-0 group-hover:opacity-100',
        )}
      >
        <Pin className="size-3.5" />
      </button>
    </div>
  );
}

function SpeakerGrid({
  tracks,
  pinnedSid,
  onPin,
}: {
  tracks: TrackReferenceOrPlaceholder[];
  pinnedSid: string | null;
  onPin: (sid: string | null) => void;
}) {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Waiting for speakers to go live…
        </p>
      </div>
    );
  }

  const pinnedTrack = pinnedSid
    ? (tracks.find(t => t.participant.sid === pinnedSid) ?? null)
    : null;

  if (pinnedTrack) {
    const others = tracks.filter(t => t.participant.sid !== pinnedSid);
    return (
      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <TileWithPinButton
          track={pinnedTrack}
          isPinned
          onPin={() => onPin(null)}
          className="min-w-0 flex-1"
        />
        {others.length > 0 ? (
          <div className="flex w-36 shrink-0 flex-col gap-2 overflow-y-auto">
            {others.map(track => (
              <TileWithPinButton
                key={`${track.participant.identity}-${track.source}`}
                track={track}
                isPinned={false}
                onPin={() => onPin(track.participant.sid)}
                className="aspect-video w-full"
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid min-h-0 flex-1 gap-2 p-2',
        gridColsClass(tracks.length),
      )}
    >
      {tracks.map(track => (
        <TileWithPinButton
          key={`${track.participant.identity}-${track.source}`}
          track={track}
          isPinned={false}
          onPin={() => onPin(track.participant.sid)}
        />
      ))}
    </div>
  );
}

function ScreenShareFocusLayout({
  screenTracks,
  cameraTracks,
}: {
  screenTracks: TrackReferenceOrPlaceholder[];
  cameraTracks: TrackReferenceOrPlaceholder[];
}) {
  return (
    <div className="flex min-h-0 flex-1 gap-2 p-2">
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg">
        <ParticipantTile trackRef={screenTracks[0]} className="h-full w-full" />
      </div>
      {cameraTracks.length > 0 ? (
        <div className="flex w-36 shrink-0 flex-col gap-2 overflow-y-auto">
          {cameraTracks.map(track => (
            <div
              key={`${track.participant.identity}-cam`}
              className="aspect-video w-full overflow-hidden rounded-lg"
            >
              <ParticipantTile trackRef={track} className="h-full w-full" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type LikeButtonProps = {
  count: number;
  bump: boolean;
  onLike: () => void;
};

function LikeButton({ count, bump, onLike }: LikeButtonProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onLike}
        className={cn(
          'cursor-pointer rounded-full p-3 transition-all duration-200',
          bump ? 'scale-125' : 'scale-100',
          'bg-pink-900/30 hover:bg-pink-900/50',
        )}
      >
        <Heart className="size-5" />
      </button>
      {count > 0 ? (
        <span className="min-w-[1.25rem] text-center text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
          {count}
        </span>
      ) : null}
    </div>
  );
}

type SpeakerControlBarProps = {
  isEnding: boolean;
  onRequestLeave: () => void;
  onRequestEndConference?: () => void;
  likeCount: number;
  likeBump: boolean;
  onLike: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
};

function SpeakerControlBar({
  isEnding,
  onRequestLeave,
  onRequestEndConference,
  likeCount,
  likeBump,
  onLike,
  isChatOpen,
  onToggleChat,
}: SpeakerControlBarProps) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const participants = useParticipants();
  const activeSpeakerCount = participants.filter(
    p => p.permissions?.canPublish === true,
  ).length;

  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  );
  const isScreenShareEnabled = screenShareTracks.some(
    t => t.participant.identity === localParticipant.identity,
  );

  const toggleMic = () =>
    void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  const toggleCamera = () =>
    void localParticipant.setCameraEnabled(!isCameraEnabled);
  const toggleScreenShare = () =>
    void localParticipant.setScreenShareEnabled(!isScreenShareEnabled);

  return (
    <div className="flex shrink-0 items-center border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-white [&_svg]:stroke-zinc-900 dark:[&_svg]:stroke-white">
      <div className="flex flex-1 items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleMic}
          className={cn(
            'cursor-pointer rounded-full p-3 transition-all',
            isMicrophoneEnabled
              ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
              : 'bg-red-900/40 hover:bg-red-900/60',
          )}
        >
          {isMicrophoneEnabled ? (
            <Mic className="size-5" />
          ) : (
            <MicOff className="size-5" />
          )}
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          className={cn(
            'cursor-pointer rounded-full p-3 transition-all',
            isCameraEnabled
              ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
              : 'bg-red-900/40 hover:bg-red-900/60',
          )}
        >
          {isCameraEnabled ? (
            <Video className="size-5" />
          ) : (
            <VideoOff className="size-5" />
          )}
        </button>

        <button
          type="button"
          onClick={toggleScreenShare}
          className={cn(
            'cursor-pointer rounded-full p-3 transition-all',
            isScreenShareEnabled
              ? 'bg-orange-500/30 hover:bg-orange-500/40'
              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700',
          )}
        >
          {isScreenShareEnabled ? (
            <MonitorOff className="size-5" />
          ) : (
            <Monitor className="size-5" />
          )}
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

        <LikeButton count={likeCount} bump={likeBump} onLike={onLike} />

        {onToggleChat !== undefined ? (
          <>
            <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button
              type="button"
              onClick={onToggleChat}
              className={cn(
                'cursor-pointer rounded-full p-3 transition-all',
                isChatOpen
                  ? 'bg-orange-500/30 hover:bg-orange-500/40'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700',
              )}
            >
              <MessageSquare className="size-5" />
            </button>
          </>
        ) : null}
      </div>

      {activeSpeakerCount <= 1 ? (
        <button
          type="button"
          disabled={isEnding}
          onClick={onRequestEndConference}
          className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          <PhoneOff className="size-4" />
          End conference
        </button>
      ) : (
        <button
          type="button"
          onClick={onRequestLeave}
          className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <LogOut className="size-4" />
          Leave
        </button>
      )}
    </div>
  );
}

function ListenerControlBar({
  onRequestLeave,
  likeCount,
  likeBump,
  onLike,
  isChatOpen,
  onToggleChat,
}: {
  onRequestLeave: () => void;
  likeCount: number;
  likeBump: boolean;
  onLike: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-white [&_svg]:stroke-zinc-900 dark:[&_svg]:stroke-white">
      <div className="flex flex-1 items-center justify-center gap-2">
        <LikeButton count={likeCount} bump={likeBump} onLike={onLike} />

        {onToggleChat !== undefined ? (
          <>
            <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button
              type="button"
              onClick={onToggleChat}
              className={cn(
                'cursor-pointer rounded-full p-3 transition-all',
                isChatOpen
                  ? 'bg-orange-500/30 hover:bg-orange-500/40'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700',
              )}
            >
              <MessageSquare className="size-5" />
            </button>
          </>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRequestLeave}
        className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        <LogOut className="size-4" />
        Leave
      </button>
    </div>
  );
}

type ConferenceVideoStageProps = {
  isSpeaker: boolean;
  isEnding: boolean;
  onAutoEnd: () => void;
  onRequestLeave: () => void;
  onRequestEndConference?: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  className?: string;
};

export function ConferenceVideoStage({
  isSpeaker,
  isEnding,
  onAutoEnd,
  onRequestLeave,
  onRequestEndConference,
  isChatOpen,
  onToggleChat,
  className,
}: ConferenceVideoStageProps) {
  const [pinnedSid, setPinnedSid] = useState<string | null>(null);
  const { count: likeCount, bump: likeBump, sendLike } = useLikes();
  const participants = useParticipants();
  const viewerCount = participants.length;

  const hadMultipleRef = useRef(false);

  useEffect(() => {
    if (participants.length > 1) {
      hadMultipleRef.current = true;
      return;
    }

    if (!hadMultipleRef.current) return;

    const timer = setTimeout(() => {
      toast.message('Conference ended as all participants have left.');
      onAutoEnd();
    }, 5000);

    return () => clearTimeout(timer);
  }, [participants.length, onAutoEnd]);

  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  );

  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: false },
  );

  const hasScreenShare = screenTracks.length > 0;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950',
        className,
      )}
    >
      <RoomAudioRenderer />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white">
          <Users className="size-3.5" />
          <span>{viewerCount}</span>
        </div>

        {hasScreenShare ? (
          <ScreenShareFocusLayout
            screenTracks={screenTracks}
            cameraTracks={cameraTracks}
          />
        ) : (
          <SpeakerGrid
            tracks={cameraTracks}
            pinnedSid={pinnedSid}
            onPin={setPinnedSid}
          />
        )}
      </div>

      {isSpeaker ? (
        <SpeakerControlBar
          isEnding={isEnding}
          onRequestLeave={onRequestLeave}
          onRequestEndConference={onRequestEndConference}
          likeCount={likeCount}
          likeBump={likeBump}
          onLike={sendLike}
          isChatOpen={isChatOpen}
          onToggleChat={onToggleChat}
        />
      ) : (
        <ListenerControlBar
          onRequestLeave={onRequestLeave}
          likeCount={likeCount}
          likeBump={likeBump}
          onLike={sendLike}
          isChatOpen={isChatOpen}
          onToggleChat={onToggleChat}
        />
      )}
    </div>
  );
}
