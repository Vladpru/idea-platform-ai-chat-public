import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { NetworkIntelligence } from '../../assets/SidebarIcons';
import { AiChatInput } from '../AiChatInput';

const suggestions = [
  'What is the difference between a problem and an idea?',
  'What AI tools are available when creating an idea?',
  'Can two people collaborate on an idea?',
];

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
};

export function AiChatPopover({ onClose }: Props) {
  return (
    <motion.div
      variants={genieVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ transformOrigin: 'bottom right' }}
      className={cn(
        'fixed bottom-24 right-6 z-50',
        'flex h-[480px] w-[360px] flex-col',
        'bg-card border-border rounded-2xl border shadow-2xl',
        'overflow-hidden',
      )}
    >
      <div className="border-border flex shrink-0 items-center gap-2.5 border-b px-4 py-3">
        <div className="bg-brand-dark-blue flex h-7 w-7 items-center justify-center rounded-lg">
          <NetworkIntelligence className="size-4 text-white" />
        </div>
        <span className="text-foreground flex-1 text-sm font-semibold">AI Assistant</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-brand-dark-blue flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
            <NetworkIntelligence className="size-6 text-white" />
          </div>
          <p className="text-foreground text-sm font-medium">Ask about your ideas &amp; problems</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              className={cn(
                'border-border bg-card hover:border-brand-dark-blue/30 hover:bg-brand-dark-blue/4',
                'rounded-xl border px-3 py-2 text-left text-xs text-muted-foreground',
                'transition-colors duration-150',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0">
        <AiChatInput onSend={() => {}} isStreaming={false} />
      </div>
    </motion.div>
  );
}
