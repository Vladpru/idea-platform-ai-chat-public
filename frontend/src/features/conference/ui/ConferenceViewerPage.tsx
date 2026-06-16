import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { updateConference } from '@/features/conference/api/conference.api';
import type {
  ConferenceEntityType,
  ConferenceRole,
} from '@/features/conference/api/conference-api.types';
import { useJoinConferenceMutation } from '@/features/conference/hooks/mutations/use-join-conference-mutation';
import { useUpdateConferenceMutation } from '@/features/conference/hooks/mutations/use-update-conference-mutation';
import { useConferenceQuery } from '@/features/conference/hooks/queries/use-conference-query';
import {
  getEntityDetailPath,
  getEntityNoun,
} from '@/features/conference/lib/conference-navigation';
import { conferenceQueryKeys } from '@/features/conference/lib/conference-query-keys';
import type { PreJoinPrefs } from '@/shared/ui/pre-join-room';
import { PreJoinRoom } from '@/shared/ui/pre-join-room';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import { Link, useBlocker, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/shared/lib/utils';

import { ConferenceListenerView } from './ConferenceListenerView';
import { ConferenceStage } from './ConferenceStage';
import { ConferenceWaitingRoom } from './ConferenceWaitingRoom';

type ConferenceSessionState = {
  token: string;
  livekitUrl: string;
  role: ConferenceRole;
};

type ConferenceViewerPageProps = {
  entityType: ConferenceEntityType;
  entityId: string;
  conferenceId: string;
};

export function ConferenceViewerPage({
  entityType,
  entityId,
  conferenceId,
}: ConferenceViewerPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = useAuthSessionStore(state => state.user?.id);

  const entity = useMemo(
    () => ({ entityType, entityId }),
    [entityType, entityId],
  );
  const entityDetailPath = useMemo(
    () => getEntityDetailPath(entity),
    [entity],
  );
  const entityNoun = getEntityNoun(entityType);

  const {
    data: conference,
    isLoading,
    isError,
    refetch,
  } = useConferenceQuery(entity, conferenceId);
  const joinMutation = useJoinConferenceMutation(entity, conferenceId);
  const updateMutation = useUpdateConferenceMutation(entity);

  const [session, setSession] = useState<ConferenceSessionState | null>(null);
  const [isReadyToJoin, setIsReadyToJoin] = useState(false);
  const [joinPrefs, setJoinPrefs] = useState<PreJoinPrefs | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveAction, setLeaveAction] = useState<'leave' | 'end'>('leave');
  const [prevStatus, setPrevStatus] = useState(conference?.status);

  const joinAttemptedRef = useRef(false);
  const reconnectingRef = useRef(false);
  const sessionRef = useRef<ConferenceSessionState | null>(null);
  const joinPrefsRef = useRef<PreJoinPrefs | null>(null);
  const joinMutateAsyncRef = useRef(joinMutation.mutateAsync);

  if (conference?.status !== prevStatus) {
    setPrevStatus(conference?.status);
    if (conference?.status === 'SCHEDULED') {
      setSession(null);
      setIsReadyToJoin(false);
      setJoinPrefs(null);
    }
  }

  useEffect(() => {
    sessionRef.current = session;
    joinPrefsRef.current = joinPrefs;
    joinMutateAsyncRef.current = joinMutation.mutateAsync;
  });

  const isAuthor = Boolean(
    currentUserId && conference?.scheduledBy.id === currentUserId,
  );

  const beginLiveSession = useCallback(async () => {
    const response = await joinMutateAsyncRef.current();
    setIsReadyToJoin(false);
    setSession({
      token: response.token,
      livekitUrl: response.livekitUrl,
      role: response.role,
    });
  }, []);

  useEffect(() => {
    if (
      conference?.status !== 'LIVE' ||
      joinAttemptedRef.current ||
      session ||
      joinMutation.isPending
    ) {
      return;
    }

    joinAttemptedRef.current = true;

    void beginLiveSession().catch(() => {
      void navigate({ to: entityDetailPath });
    });
  }, [
    beginLiveSession,
    conference?.status,
    entityDetailPath,
    joinMutation.isPending,
    navigate,
    session,
  ]);

  useEffect(() => {
    if (conference?.status === 'SCHEDULED') {
      joinAttemptedRef.current = false;
    }
  }, [conference?.status]);

  const handleStartConference = async () => {
    await updateMutation.mutateAsync({
      conferenceId,
      action: 'start',
    });
    await refetch();
  };

  const handleLeave = useCallback(() => {
    setSession(null);
    setIsReadyToJoin(false);
    setJoinPrefs(null);
    joinAttemptedRef.current = false;
    void queryClient.invalidateQueries({
      queryKey: conferenceQueryKeys.byEntity(entity),
    });
  }, [entity, queryClient]);

  const handleAutoEnd = useCallback(async () => {
    await updateConference(entity, conferenceId, { action: 'end' }).catch(
      () => {},
    );
    void queryClient.invalidateQueries({
      queryKey: conferenceQueryKeys.byEntity(entity),
    });
    setSession(null);
    setIsReadyToJoin(false);
    setJoinPrefs(null);
    joinAttemptedRef.current = false;
  }, [conferenceId, entity, queryClient]);

  const handleConnectionLost = useCallback(async () => {
    const currentSession = sessionRef.current;

    if (!currentSession) {
      return;
    }

    if (reconnectingRef.current) {
      toast.error(
        `Conference disconnected. Please rejoin from the ${entityNoun} page.`,
      );
      setSession(null);
      setIsReadyToJoin(false);
      joinAttemptedRef.current = false;
      void navigate({ to: entityDetailPath });
      return;
    }

    reconnectingRef.current = true;
    toast.message('Connection lost. Attempting to reconnect...');

    try {
      await beginLiveSession();
      const savedPrefs = joinPrefsRef.current;
      if (savedPrefs) {
        setJoinPrefs(savedPrefs);
        setIsReadyToJoin(true);
      }
      toast.success('Reconnected to the conference');
    } catch {
      toast.error(
        `Could not reconnect. Please try again from the ${entityNoun} page.`,
      );
      setSession(null);
      setIsReadyToJoin(false);
      joinAttemptedRef.current = false;
      void navigate({ to: entityDetailPath });
    } finally {
      reconnectingRef.current = false;
    }
  }, [beginLiveSession, entityDetailPath, entityNoun, navigate]);

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => Boolean(session && isReadyToJoin),
    enableBeforeUnload: () => Boolean(session && isReadyToJoin),
    withResolver: true,
  });

  const showLeaveModal = isLeaveModalOpen || status === 'blocked';

  const handleRequestLeave = useCallback(() => {
    setLeaveAction('leave');
    setIsLeaveModalOpen(true);
  }, []);

  const handleRequestEndConference = useCallback(() => {
    setLeaveAction('end');
    setIsLeaveModalOpen(true);
  }, []);

  const handleCancelLeave = useCallback(() => {
    setIsLeaveModalOpen(false);
    reset?.();
  }, [reset]);

  const handleConfirmLeave = useCallback(async () => {
    const shouldProceed = status === 'blocked';

    if (leaveAction === 'end') {
      await updateMutation
        .mutateAsync({ conferenceId, action: 'end' })
        .catch(() => {});
    }

    setIsLeaveModalOpen(false);
    setSession(null);
    setIsReadyToJoin(false);
    setJoinPrefs(null);
    joinAttemptedRef.current = false;

    if (shouldProceed) {
      proceed?.();
    } else {
      void navigate({ to: entityDetailPath });
    }
  }, [
    conferenceId,
    entityDetailPath,
    leaveAction,
    navigate,
    proceed,
    status,
    updateMutation,
  ]);

  const handlePreJoin = useCallback((prefs: PreJoinPrefs) => {
    setJoinPrefs(prefs);
    setIsReadyToJoin(true);
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] items-center justify-center">
        <p className="text-brand-gray-500 text-sm">Loading conference...</p>
      </div>
    );
  }

  if (isError || !conference) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center gap-4 px-4">
        <p className="text-brand-gray-600 text-sm">Conference not found.</p>
        <Link
          to={entityDetailPath}
          className="text-primary text-sm font-medium hover:underline"
        >
          Back to {entityNoun}
        </Link>
      </div>
    );
  }

  if (conference.status === 'ENDED' || conference.status === 'CANCELLED') {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-brand-dark-blue text-2xl font-bold">
          {conference.title}
        </h1>
        <p className="text-brand-gray-600 text-sm">
          This conference has {conference.status.toLowerCase()}.
        </p>
        <Link
          to={entityDetailPath}
          className="text-primary text-sm font-medium hover:underline"
        >
          Back to {entityNoun}
        </Link>
      </div>
    );
  }

  const showLiveShell = conference.status === 'LIVE';

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <div className="border-brand-gray-200 bg-card shrink-0 border-b px-4 py-4 sm:px-6">
        <Link
          to={entityDetailPath}
          className="text-brand-dark-blue inline-flex items-center text-sm font-medium hover:underline"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to {entityNoun}
        </Link>
      </div>

      {conference.status === 'SCHEDULED' ? (
        <ConferenceWaitingRoom
          conference={conference}
          isAuthor={isAuthor}
          isStarting={updateMutation.isPending}
          onStartConference={() => void handleStartConference()}
        />
      ) : null}

      {showLiveShell ? (
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden',
            !session && 'items-center justify-center px-4 py-10',
          )}
        >
          {!session ? (
            <p className="text-brand-gray-500 text-sm">
              {joinMutation.isPending
                ? 'Joining conference...'
                : 'Preparing live session...'}
            </p>
          ) : null}

          {session && session.role === 'speaker' && !isReadyToJoin ? (
            <PreJoinRoom
              onJoin={handlePreJoin}
              onCancel={handleLeave}
              className="flex-1"
            />
          ) : null}

          {session && session.role === 'speaker' && isReadyToJoin ? (
            <ConferenceStage
              token={session.token}
              livekitUrl={session.livekitUrl}
              isEnding={updateMutation.isPending}
              startWithAudio={audioOption}
              startWithVideo={videoOption}
              onLeave={handleLeave}
              onConnectionLost={() => void handleConnectionLost()}
              onAutoEnd={handleAutoEnd}
              onRequestLeave={handleRequestLeave}
              onRequestEndConference={handleRequestEndConference}
              className="flex-1"
            />
          ) : null}

          {session && session.role === 'listener' ? (
            <ConferenceListenerView
              token={session.token}
              livekitUrl={session.livekitUrl}
              onLeave={handleLeave}
              onConnectionLost={() => void handleConnectionLost()}
              onAutoEnd={handleLeave}
              onRequestLeave={handleRequestLeave}
              className="flex-1"
            />
          ) : null}
        </div>
      ) : null}

      <ConfirmModal
        open={showLeaveModal}
        onOpenChange={open => {
          if (!open) handleCancelLeave();
        }}
        title="Leave the call?"
        description="Are you sure you want to leave? If you are the host, the conference will be ended for everyone."
        confirmLabel="LEAVE"
        cancelLabel="STAY"
        onConfirm={() => {
          void handleConfirmLeave();
        }}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
