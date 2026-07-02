import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import type { ChatActionPayload, ChatMessage } from '../../api/ai-chat.types';
import { NetworkIntelligence } from '../../assets/SidebarIcons';
import { AiChatCreateCard } from '../AiChatCreateCard';
import { AiChatEmptyState } from '../AiChatEmptyState';
import { AiChatInput } from '../AiChatInput';
import { AiChatMessageList } from '../AiChatMessageList';
import { AiChatSuggestions } from '../AiChatSuggestions';

const genieVariants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    y: 40,
    scaleX: 0.6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    scaleX: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 280,
      damping: 22,
      opacity: { duration: 0.12 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.2,
    y: 30,
    scaleX: 0.5,
    transition: {
      duration: 0.18,
      ease: 'easeIn' as const,
    },
  },
};

type Props = {
  onClose: () => void;
  send: (message: string) => void;
  isStreaming: boolean;
  messages: ChatMessage[];
  suggestions: string[];
  pendingAction: ChatActionPayload | null;
  clearPendingAction: () => void;
};

export function AiChatPopover({
  onClose,
  send,
  isStreaming,
  messages,
  suggestions,
  pendingAction,
  clearPendingAction,
}: Props) {
  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <motion.div
      variants={genieVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ transformOrigin: 'bottom right' }}
      className={cn(
        'fixed right-6 bottom-24 z-50',
        'flex h-[480px] w-[360px] flex-col',
        'bg-card border-border rounded-2xl border shadow-2xl',
        'overflow-hidden',
      )}
    >
      <div className="border-border flex shrink-0 items-center gap-2.5 border-b px-4 py-3">
        <div className="bg-brand-dark-blue flex h-7 w-7 items-center justify-center rounded-lg">
          <NetworkIntelligence className="size-4 text-white" />
        </div>
        <span className="text-foreground flex-1 text-sm font-semibold">
          AI Assistant
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {hasMessages ? (
        <AiChatMessageList messages={messages} isWidget />
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <AiChatEmptyState onSuggestion={send} isLoading={isStreaming} />
        </div>
      )}

      {!isStreaming && pendingAction && (
        <div className="shrink-0">
          <AiChatCreateCard
            action={pendingAction}
            onDismiss={clearPendingAction}
            isWidget
          />
        </div>
      )}

      {!isStreaming && suggestions.length > 0 && (
        <div className="shrink-0 px-3 pb-2">
          <AiChatSuggestions
            suggestions={suggestions}
            onSelect={send}
            isWidget
          />
        </div>
      )}

      <div className="shrink-0">
        <AiChatInput onSend={send} isStreaming={isStreaming} isWidget />
      </div>
    </motion.div>
  );
}
