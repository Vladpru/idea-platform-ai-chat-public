import '@livekit/components-styles';
import { LiveKitRoom } from '@livekit/components-react';
import {
  DisconnectReason,
  type AudioCaptureOptions,
  type RoomOptions,
  type VideoCaptureOptions,
} from 'livekit-client';
import { useCallback, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { ConferenceChat } from './ConferenceChat';
import { ConferenceVideoStage } from './ConferenceVideoStage';

type ConferenceStageProps = {
  token: string;
  livekitUrl: string;
  isEnding: boolean;
  startWithAudio: AudioCaptureOptions | boolean;
  startWithVideo: VideoCaptureOptions | boolean;
  onLeave: () => void;
  onConnectionLost: () => void;
  onAutoEnd: () => void;
  onRequestLeave: () => void;
  onRequestEndConference: () => void;
  className?: string;
};

const roomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
};

function shouldAttemptReconnect(reason?: DisconnectReason): boolean {
  if (reason === undefined) return true;
  return (
    reason !== DisconnectReason.CLIENT_INITIATED &&
    reason !== DisconnectReason.ROOM_DELETED &&
    reason !== DisconnectReason.PARTICIPANT_REMOVED
  );
}

type MobileTab = 'stage' | 'chat';

export function ConferenceStage({
  token,
  livekitUrl,
  isEnding,
  startWithAudio,
  startWithVideo,
  onLeave,
  onConnectionLost,
  onAutoEnd,
  onRequestLeave,
  onRequestEndConference,
  className,
}: ConferenceStageProps) {
  const intentionalDisconnectRef = useRef(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('stage');
  const [isChatOpen, setIsChatOpen] = useState(true);

  const handleSystemLeave = useCallback(() => {
    intentionalDisconnectRef.current = true;
    onLeave();
  }, [onLeave]);

  const handleButtonLeave = useCallback(() => {
    onRequestLeave();
  }, [onRequestLeave]);

  const handleButtonEndConference = useCallback(() => {
    onRequestEndConference();
  }, [onRequestEndConference]);

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
      onMediaDeviceFailure={handleSystemLeave}
      className={cn(
        'flex min-h-0 w-full flex-col overflow-hidden bg-white dark:bg-zinc-950',
        className,
      )}
    >
      <div className="hidden min-h-0 flex-1 overflow-hidden sm:flex sm:flex-row">
        <ConferenceVideoStage
          isSpeaker
          isEnding={isEnding}
          onAutoEnd={onAutoEnd}
          onRequestLeave={handleButtonLeave}
          onRequestEndConference={handleButtonEndConference}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(c => !c)}
          className="flex-1"
        />
        {isChatOpen && <ConferenceChat className="w-80 shrink-0" />}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:hidden">
        <ConferenceVideoStage
          isSpeaker
          isEnding={isEnding}
          onAutoEnd={onAutoEnd}
          onRequestLeave={handleButtonLeave}
          onRequestEndConference={handleButtonEndConference}
          className={cn('flex-1', activeTab !== 'stage' && 'hidden')}
        />
        <ConferenceChat
          className={cn('flex-1', activeTab !== 'chat' && 'hidden')}
        />

        <div className="grid shrink-0 grid-cols-2 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            className={cn(
              'py-3 text-sm font-medium transition-colors',
              activeTab === 'stage'
                ? 'border-b-2 border-brand-orange text-brand-orange'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
            onClick={() => setActiveTab('stage')}
          >
            Stage
          </button>
          <button
            type="button"
            className={cn(
              'py-3 text-sm font-medium transition-colors',
              activeTab === 'chat'
                ? 'border-b-2 border-brand-orange text-brand-orange'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>
      </div>
    </LiveKitRoom>
  );
}
