import { LiveChatRoomPanel } from '@/features/live-chat/ui/room/LiveChatRoomPanel';
import type { PreJoinPrefs } from '@/shared/ui/pre-join-room';
import { PreJoinRoom } from '@/shared/ui/pre-join-room';
import { VideoCallRoom } from '@/features/live-chat/ui/video-call/VideoCallRoom';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useState } from 'react';

export type VideoSessionState = {
  callId: string;
  token: string;
  livekitUrl: string;
};

type LiveChatCallLayoutProps = {
  roomId: string;
  videoSession: VideoSessionState | null;
  onLeaveVideo: () => void;
  onConnectionLost: () => void;
  mobileTab: 'video' | 'chat';
  onMobileTabChange: (tab: 'video' | 'chat') => void;
  isDm?: boolean;
};

export function LiveChatCallLayout({
  roomId,
  videoSession,
  onLeaveVideo,
  onConnectionLost,
  mobileTab,
  onMobileTabChange,
  isDm,
}: LiveChatCallLayoutProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isReadyToJoin, setIsReadyToJoin] = useState(false);
  const [joinPrefs, setJoinPrefs] = useState<PreJoinPrefs | null>(null);
  const [prevCallId, setPrevCallId] = useState(videoSession?.callId);

  if (videoSession?.callId !== prevCallId) {
    setPrevCallId(videoSession?.callId);
    if (videoSession) {
      setIsReadyToJoin(false);
      setJoinPrefs(null);
    }
  }

  const handlePreJoin = (prefs: PreJoinPrefs) => {
    setJoinPrefs(prefs);
    setIsReadyToJoin(true);
  };

  const showVideo = videoSession !== null;

  if (!showVideo) {
    return (
      <LiveChatRoomPanel
        roomId={roomId}
        className="flex min-h-0 flex-1 flex-col"
      />
    );
  }

  if (!isReadyToJoin) {
    if (isMobile) {
      return (
        <Tabs
          value={mobileTab}
          onValueChange={value => onMobileTabChange(value as 'video' | 'chat')}
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        >
          <TabsList className="w-full shrink-0 bg-zinc-100 dark:bg-zinc-800">
            <TabsTrigger value="video" className="flex-1">
              Video
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1">
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="video"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <PreJoinRoom onJoin={handlePreJoin} onCancel={onLeaveVideo} />
          </TabsContent>

          <TabsContent
            value="chat"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <LiveChatRoomPanel
              roomId={roomId}
              className="flex min-h-0 flex-1 flex-col"
            />
          </TabsContent>
        </Tabs>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-1 flex-row overflow-hidden">
        <PreJoinRoom
          onJoin={handlePreJoin}
          onCancel={onLeaveVideo}
          className="flex min-h-0 flex-1 flex-col"
        />
        <div className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-zinc-200 dark:border-zinc-800">
          <LiveChatRoomPanel
            roomId={roomId}
            className="flex min-h-0 flex-1 flex-col"
          />
        </div>
      </div>
    );
  }

  const audioOption = joinPrefs
    ? joinPrefs.audioEnabled
      ? joinPrefs.audioDeviceId
        ? { deviceId: joinPrefs.audioDeviceId }
        : true
      : false
    : false;

  const videoOption = joinPrefs
    ? joinPrefs.videoEnabled
      ? joinPrefs.videoDeviceId
        ? { deviceId: joinPrefs.videoDeviceId }
        : true
      : false
    : false;

  const videoRoom = (
    <VideoCallRoom
      token={videoSession.token}
      livekitUrl={videoSession.livekitUrl}
      startWithAudio={audioOption}
      startWithVideo={videoOption}
      onLeave={onLeaveVideo}
      onConnectionLost={onConnectionLost}
      isChatOpen={isChatOpen}
      onToggleChat={() => setIsChatOpen(c => !c)}
      isDm={isDm}
      className="flex min-h-0 flex-1 flex-col"
    />
  );

  if (isMobile) {
    return (
      <Tabs
        value={mobileTab}
        onValueChange={value => onMobileTabChange(value as 'video' | 'chat')}
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TabsList className="w-full shrink-0 bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="video" className="flex-1">
            Video
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex-1">
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="video"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          {videoRoom}
        </TabsContent>

        <TabsContent
          value="chat"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <LiveChatRoomPanel
            roomId={roomId}
            className="flex min-h-0 flex-1 flex-col"
          />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-row overflow-hidden">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {videoRoom}
      </div>

      {isChatOpen && (
        <div className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-zinc-200 dark:border-zinc-800">
          <LiveChatRoomPanel
            roomId={roomId}
            className="flex min-h-0 flex-1 flex-col"
          />
        </div>
      )}
    </div>
  );
}
