import { useRouterState } from '@tanstack/react-router';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { AiChatFab } from './AiChatFab';
import { AiChatPopover } from './AiChatPopover';

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useRouterState({ select: s => s.location.pathname });

  if (pathname.startsWith('/ai-chat')) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && <AiChatPopover onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
      <AiChatFab isOpen={isOpen} onClick={() => setIsOpen(prev => !prev)} />
    </>
  );
}
