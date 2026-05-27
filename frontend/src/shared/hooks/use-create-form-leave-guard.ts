import { useBlocker } from '@tanstack/react-router';
import { useCallback, useRef, useState } from 'react';

export type UseCreateFormLeaveGuardOptions = {
  hasUnsavedProgress: boolean;
  isBusy: boolean;
  onSaveDraft: () => Promise<boolean>;
  onDiscard: () => void;
};

export function useCreateFormLeaveGuard({
  hasUnsavedProgress,
  isBusy,
  onSaveDraft,
  onDiscard,
}: UseCreateFormLeaveGuardOptions) {
  const [manualLeaveModalOpen, setManualLeaveModalOpen] = useState(false);
  const pendingLeaveRef = useRef<(() => void) | null>(null);
  const isLeavingRef = useRef(false);

  const shouldBlockLeave = hasUnsavedProgress && !isBusy;

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => {
      if (isLeavingRef.current) {
        return false;
      }

      return shouldBlockLeave;
    },
    enableBeforeUnload: () => shouldBlockLeave && !isLeavingRef.current,
    withResolver: true,
  });

  const isNavigationBlocked = status === 'blocked';
  const leaveModalOpen = manualLeaveModalOpen || isNavigationBlocked;

  const closeLeaveModal = useCallback(() => {
    setManualLeaveModalOpen(false);
    pendingLeaveRef.current = null;
    if (isNavigationBlocked) {
      reset();
    }
  }, [isNavigationBlocked, reset]);

  const completeLeave = useCallback(() => {
    isLeavingRef.current = true;
    setManualLeaveModalOpen(false);
    const continueLeave = pendingLeaveRef.current;
    pendingLeaveRef.current = null;

    if (isNavigationBlocked) {
      proceed();
      return;
    }

    continueLeave?.();
  }, [isNavigationBlocked, proceed]);

  const requestLeave = useCallback(
    (continueLeave: () => void) => {
      if (!shouldBlockLeave) {
        continueLeave();
        return;
      }

      pendingLeaveRef.current = continueLeave;
      setManualLeaveModalOpen(true);
    },
    [shouldBlockLeave],
  );

  const allowNextLeave = useCallback((continueLeave: () => void) => {
    isLeavingRef.current = true;
    continueLeave();
  }, []);

  const handleDiscard = useCallback(() => {
    onDiscard();
    completeLeave();
  }, [completeLeave, onDiscard]);

  const handleSaveAsDraft = useCallback(async () => {
    const isSaved = await onSaveDraft();
    if (!isSaved) {
      return;
    }

    completeLeave();
  }, [completeLeave, onSaveDraft]);

  const handleLeaveModalOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setManualLeaveModalOpen(true);
        return;
      }

      closeLeaveModal();
    },
    [closeLeaveModal],
  );

  return {
    leaveModalOpen,
    requestLeave,
    allowNextLeave,
    handleLeaveModalOpenChange,
    handleDiscard,
    handleSaveAsDraft,
  };
}
