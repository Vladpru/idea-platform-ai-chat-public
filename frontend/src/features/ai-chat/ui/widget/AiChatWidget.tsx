import { useRouterState } from '@tanstack/react-router';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';

import { useWidgetChat } from '../../hooks/use-widget-chat';
import { AiChatFab } from './AiChatFab';
import { AiChatPopover } from './AiChatPopover';

type Props = {
  onApplyFieldAction?: (field: 'tags' | 'linked_problems', merged: string[]) => void;
};

export function AiChatWidget({ onApplyFieldAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useRouterState({ select: s => s.location.pathname });
  const {
    send,
    isStreaming,
    messages,
    suggestions,
    pendingAction,
    clearPendingAction,
    pendingFieldAction,
    clearPendingFieldAction,
    pageContext,
  } = useWidgetChat();

  const handleApplyFieldAction = useCallback(
    (field: 'tags' | 'linked_problems', merged: string[]) => {
      onApplyFieldAction?.(field, merged);
    },
    [onApplyFieldAction],
  );

  if (pathname.startsWith('/ai-chat')) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <AiChatPopover
            onClose={() => setIsOpen(false)}
            send={send}
            isStreaming={isStreaming}
            messages={messages}
            suggestions={suggestions}
            pendingAction={pendingAction}
            clearPendingAction={clearPendingAction}
            pendingFieldAction={pendingFieldAction}
            onApplyFieldAction={handleApplyFieldAction}
            clearPendingFieldAction={clearPendingFieldAction}
            pageContext={pageContext}
          />
        )}
      </AnimatePresence>
      <AiChatFab isOpen={isOpen} onClick={() => setIsOpen(prev => !prev)} />
    </>
  );
}
