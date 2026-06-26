import { cn } from '@/shared/lib/utils';

import { NetworkIntelligence } from '../assets/SidebarIcons';

type Props = {
  onNewChat: () => void;
  isLoading?: boolean;
};

const suggestions = [
  'What ideas are currently in prototyping?',
  'Summarize the top problems this month',
  'Which ideas have the most engagement?',
  'Find ideas related to customer experience',
];

export function AiChatEmptyState({ onNewChat, isLoading }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-brand-dark-blue flex h-14 w-14 items-center justify-center rounded-2xl shadow-md">
          <NetworkIntelligence className="size-8 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Ask about your ideas &amp; problems
        </h2>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {suggestions.map(suggestion => (
          <button
            key={suggestion}
            type="button"
            onClick={onNewChat}
            disabled={isLoading}
            className={cn(
              'border-border bg-card hover:border-brand-dark-blue/30 hover:bg-brand-dark-blue/4',
              'rounded-xl border px-4 py-2.5 text-left text-sm text-muted-foreground',
              'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
