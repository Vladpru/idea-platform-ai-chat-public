import { MessageSquareText, X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

type Props = {
  isOpen: boolean;
  onClick: () => void;
};

export function AiChatFab({ isOpen, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      className={cn(
        'fixed right-6 bottom-6 z-50',
        'flex h-14 w-14 items-center justify-center rounded-full',
        'bg-brand-dark-blue text-white shadow-lg',
        'transition-all duration-200 hover:opacity-90 active:scale-95',
      )}
    >
      <span
        className={cn(
          'absolute transition-all duration-200',
          isOpen ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0',
        )}
      >
        <X size={22} />
      </span>
      <span
        className={cn(
          'absolute transition-all duration-200',
          isOpen ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100',
        )}
      >
        <MessageSquareText className="text-white" />
      </span>
    </button>
  );
}
pendingAction;
