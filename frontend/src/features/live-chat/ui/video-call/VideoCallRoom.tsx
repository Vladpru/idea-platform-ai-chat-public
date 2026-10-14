import '@livekit/components-styles';
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import {
  DisconnectReason,
  RoomEvent,
  Track,
  type AudioCaptureOptions,
  type RoomOptions,
  type VideoCaptureOptions,
} from 'livekit-client';
import {
  Heart,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { ConfirmModal } from '@/shared/ui/confirm-modal';

type VideoCallRoomProps = {
  token: string;
  livekitUrl: string;
  startWithAudio: AudioCaptureOptions | boolean;
  startWithVideo: VideoCaptureOptions | boolean;
  onLeave: () => void;
  onConnectionLost: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  isDm?: boolean;
  className?: string;
};

const roomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
};

const REACTION_LIKE = 'REACTION:LIKE';

function shouldAttemptReconnect(reason?: DisconnectReason): boolean {
  if (reason === undefined) return true;
  return (
    reason !== DisconnectReason.CLIENT_INITIATED &&
    reason !== DisconnectReason.ROOM_DELETED &&
    reason !== DisconnectReason.PARTICIPANT_REMOVED
  );
}

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

function tileGridCols(count: number): string {
  if (count === 1) return 'grid-cols-1';
  if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
  if (count <= 9) return 'grid-cols-2 md:grid-cols-3';
  return 'grid-cols-2 md:grid-cols-4';
}

function CameraGrid({ tracks }: { tracks: TrackReferenceOrPlaceholder[] }) {
  if (tracks.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Waiting for participants…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'grid w-full gap-4',
            tileGridCols(tracks.length),
            tracks.length === 1 && 'max-w-2xl',
          )}
        >
          {tracks.map(track => (
            <div
              key={`${track.participant.identity}-${track.source}`}
              className="aspect-video w-full overflow-hidden rounded-2xl"
            >
              <ParticipantTile
                trackRef={track}
                className="dark:[&_.lk-participant-name]:text-brand-orange h-full w-full [&_.lk-participant-name]:text-white [&_video]:!object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenShareLayout({
  screenTracks,
  cameraTracks,
}: {
  screenTracks: TrackReferenceOrPlaceholder[];
  cameraTracks: TrackReferenceOrPlaceholder[];
}) {
  return (
    <div className="flex min-h-0 flex-1 gap-1.5 bg-white p-1.5 dark:bg-zinc-900">
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg">
        <ParticipantTile
          trackRef={screenTracks[0]}
          className="dark:[&_.lk-participant-name]:text-brand-orange h-full w-full [&_.lk-participant-name]:text-white"
        />
      </div>
      {cameraTracks.length > 0 ? (
        <div className="flex w-32 shrink-0 flex-col gap-1.5 overflow-y-auto md:w-48">
          {cameraTracks.map(track => (
            <div
              key={`${track.participant.identity}-cam`}
              className="aspect-video w-full overflow-hidden rounded-lg"
            >
              <ParticipantTile
                trackRef={track}
                className="dark:[&_.lk-participant-name]:text-brand-orange h-full w-full [&_.lk-participant-name]:text-white [&_video]:!object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VideoStage() {
  const participants = useParticipants();
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: false },
  );
  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white">
        <Users className="size-3.5" />
        <span>{participants.length}</span>
      </div>
      {screenTracks.length > 0 ? (
        <ScreenShareLayout
          screenTracks={screenTracks}
          cameraTracks={cameraTracks}
        />
      ) : (
        <CameraGrid tracks={cameraTracks} />
      )}
    </div>
  );
}

function AutoLeaveGuard({ onLeave }: { onLeave: () => void }) {
  const remoteParticipants = useRemoteParticipants();
  const hasEverHadPeersRef = useRef(false);
  const onLeaveRef = useRef(onLeave);

  useEffect(() => {
    onLeaveRef.current = onLeave;
  });

  useEffect(() => {
    if (remoteParticipants.length > 0) {
      hasEverHadPeersRef.current = true;
      return;
    }
    if (hasEverHadPeersRef.current) {
      onLeaveRef.current();
    }
  }, [remoteParticipants.length]);

  return null;
}

type CallControlBarProps = {
  onLeave: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  isDm?: boolean;
};

function CallControlBar({
  onLeave,
  isChatOpen,
  onToggleChat,
  isDm,
}: CallControlBarProps) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const { count: likeCount, bump: likeBump, sendLike } = useLikes();

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
    <div className="flex shrink-0 items-center border-t border-zinc-200 bg-white px-4 py-3 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white [&_svg]:stroke-zinc-900 dark:[&_svg]:stroke-white">
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

        {!isDm ? (
          <>
            <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={sendLike}
                className={cn(
                  'cursor-pointer rounded-full p-3 transition-all duration-200',
                  likeBump ? 'scale-125' : 'scale-100',
                  'bg-pink-900/30 hover:bg-pink-900/50',
                )}
              >
                <Heart className="size-5" />
              </button>
              {likeCount > 0 ? (
                <span className="min-w-[1.25rem] text-center text-xs font-medium text-zinc-600 tabular-nums dark:text-zinc-300">
                  {likeCount}
                </span>
              ) : null}
            </div>
          </>
        ) : null}

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
        onClick={onLeave}
        className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        <LogOut className="size-4" />
        Leave call
      </button>
    </div>
  );
}

export function VideoCallRoom({
  token,
  livekitUrl,
  startWithAudio,
  startWithVideo,
  onLeave,
  onConnectionLost,
  isChatOpen,
  onToggleChat,
  isDm,
  className,
}: VideoCallRoomProps) {
  const intentionalDisconnectRef = useRef(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const handleLeave = useCallback(() => {
    intentionalDisconnectRef.current = true;
    onLeave();
  }, [onLeave]);

  const handleRequestLeave = useCallback(() => {
    setIsLeaveModalOpen(true);
  }, []);

  const handleDisconnected = useCallback(
    (reason?: DisconnectReason) => {
      if (intentionalDisconnectRef.current) {
        intentionalDisconnectRef.current = false;
        onLeave();
        return;
      }
      if (!shouldAttemptReconnect(reason)) {
        onLeave();
        return;
      }
      onConnectionLost();
    },
    [onConnectionLost, onLeave],
  );

  const handleError = useCallback(() => {
    if (intentionalDisconnectRef.current) return;
    onConnectionLost();
  }, [onConnectionLost]);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect
      audio={startWithAudio}
      video={startWithVideo}
      options={roomOptions}
      onDisconnected={handleDisconnected}
      onError={handleError}
      onMediaDeviceFailure={handleLeave}
      className={cn('flex min-h-0 flex-col overflow-hidden', className)}
    >
      <RoomAudioRenderer />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <VideoStage />
        <CallControlBar
          onLeave={handleRequestLeave}
          isChatOpen={isChatOpen}
          onToggleChat={onToggleChat}
          isDm={isDm}
        />
      </div>
      <AutoLeaveGuard onLeave={handleLeave} />
      <ConfirmModal
        open={isLeaveModalOpen}
        onOpenChange={setIsLeaveModalOpen}
        title="Leave the call?"
        description="Are you sure you want to leave the video call?"
        confirmLabel="LEAVE"
        cancelLabel="STAY"
        onConfirm={() => {
          setIsLeaveModalOpen(false);
          handleLeave();
        }}
      />
    </LiveKitRoom>
  );
}
