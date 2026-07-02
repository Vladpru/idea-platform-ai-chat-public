import { useRouterState } from '@tanstack/react-router';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { useWidgetChat } from '../../hooks/use-widget-chat';
import { AiChatFab } from './AiChatFab';
import { AiChatPopover } from './AiChatPopover';

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useRouterState({ select: s => s.location.pathname });
  const { send, isStreaming, messages, suggestions } = useWidgetChat();

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
          />
        )}
      </AnimatePresence>
      <AiChatFab isOpen={isOpen} onClick={() => setIsOpen(prev => !prev)} />
    </>
  );
}
