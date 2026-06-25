import { Sparkles } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

type Props = {
  onNewChat: () => void;
  isLoading?: boolean;
};

export function AiChatEmptyState({ onNewChat, isLoading }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 p-8 text-center">
      <div className="relative">
        <div className="absolute inset-0 scale-150 rounded-full bg-brand-dark-blue/15 blur-3xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-dark-blue shadow-lg">
          <Sparkles size={36} className="text-white" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">AI Assistant</h2>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Ask anything about ideas, problems, workflows, or team stats on the Idea Platform.
        </p>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        disabled={isLoading}
        className={cn(
          'rounded-xl bg-brand-dark-blue px-6 py-2.5 text-sm font-medium text-white shadow-md',
          'transition-all duration-150 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        Start a conversation
      </button>
    </div>
  );
}
