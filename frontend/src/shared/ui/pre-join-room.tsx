import '@livekit/components-styles';
import { useMediaDeviceSelect, usePreviewDevice } from '@livekit/components-react';
import type { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import { ChevronDown, Mic, MicOff, UserCircle2, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

export type PreJoinPrefs = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDeviceId: string;
  videoDeviceId: string;
};

type PreJoinRoomProps = {
  onJoin: (prefs: PreJoinPrefs) => void;
  onCancel: () => void;
  className?: string;
};

function LocalVideoPreview({ track }: { track: LocalVideoTrack | undefined }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={cn(
          'h-full w-full object-cover',
          track ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transform: 'scaleX(-1)' }}
      />
      {!track && (
        <div className="absolute inset-0 flex items-center justify-center">
          <UserCircle2 className="size-24 text-zinc-400 dark:text-zinc-600" />
        </div>
      )}
    </div>
  );
}

type DeviceSelectProps = {
  devices: MediaDeviceInfo[];
  activeDeviceId: string;
  onSelect: (id: string) => Promise<void>;
};

function DeviceSelect({ devices, activeDeviceId, onSelect }: DeviceSelectProps) {
  return (
    <div className="relative w-full">
      <select
        value={activeDeviceId}
        onChange={e => void onSelect(e.target.value)}
        className="w-full appearance-none truncate rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-8 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-500"
      >
        {devices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || device.deviceId}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
    </div>
  );
}

export function PreJoinRoom({ onJoin, onCancel, className }: PreJoinRoomProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const videoPreview = usePreviewDevice<LocalVideoTrack>(
    cameraEnabled,
    '',
    'videoinput',
  );
  const audioPreview = usePreviewDevice<LocalAudioTrack>(
    micEnabled,
    '',
    'audioinput',
  );

  const videoDevices = useMediaDeviceSelect({
    kind: 'videoinput',
    track: videoPreview.localTrack,
    requestPermissions: cameraEnabled,
  });

  const audioDevices = useMediaDeviceSelect({
    kind: 'audioinput',
    track: audioPreview.localTrack,
    requestPermissions: micEnabled,
  });

  const handleJoin = () => {
    onJoin({
      audioEnabled: micEnabled,
      videoEnabled: cameraEnabled,
      audioDeviceId: audioDevices.activeDeviceId,
      videoDeviceId: videoDevices.activeDeviceId,
    });
  };

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 items-center justify-center bg-white dark:bg-zinc-950 p-6',
        className,
      )}
    >
      <div className="flex w-full max-w-4xl flex-col gap-8 sm:flex-row sm:items-center">
        <div className="min-h-0 flex-1">
          <div className="aspect-video w-full overflow-hidden rounded-2xl">
            <LocalVideoPreview track={videoPreview.localTrack} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-5 sm:w-72 sm:shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Ready to join?</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Check your audio and video before entering.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMicEnabled(v => !v)}
                  className={cn(
                    'shrink-0 cursor-pointer rounded-full p-2.5 transition-colors',
                    micEnabled
                      ? 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600'
                      : 'bg-red-600 text-white hover:bg-red-700',
                  )}
                >
                  {micEnabled ? (
                    <Mic className="size-4" />
                  ) : (
                    <MicOff className="size-4" />
                  )}
                </button>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {micEnabled ? 'Microphone on' : 'Microphone off'}
                </span>
              </div>
              {micEnabled && audioDevices.devices.length > 1 && (
                <DeviceSelect
                  devices={audioDevices.devices}
                  activeDeviceId={audioDevices.activeDeviceId}
                  onSelect={audioDevices.setActiveMediaDevice}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCameraEnabled(v => !v)}
                  className={cn(
                    'shrink-0 cursor-pointer rounded-full p-2.5 transition-colors',
                    cameraEnabled
                      ? 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600'
                      : 'bg-red-600 text-white hover:bg-red-700',
                  )}
                >
                  {cameraEnabled ? (
                    <Video className="size-4" />
                  ) : (
                    <VideoOff className="size-4" />
                  )}
                </button>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {cameraEnabled ? 'Camera on' : 'Camera off'}
                </span>
              </div>
              {cameraEnabled && videoDevices.devices.length > 1 && (
                <DeviceSelect
                  devices={videoDevices.devices}
                  activeDeviceId={videoDevices.activeDeviceId}
                  onSelect={videoDevices.setActiveMediaDevice}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleJoin}
              className="w-full cursor-pointer rounded-lg bg-brand-orange px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Join now
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full cursor-pointer py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
