import { cn } from '@/shared/lib/utils';

import { NetworkIntelligence } from '../assets/SidebarIcons';
import { useCreateSessionMutation } from '../hooks/mutations/use-create-session-mutation';

type Props = {
  onSuggestion: (text: string) => void;
  showNewChat?: boolean;
  isLoading?: boolean;
  isWidget?: boolean;
};

const suggestions = [
  'What is the difference between a problem and an idea?',
  'What AI tools are available when creating an idea?',
  'Can two people collaborate on an idea?',
  'What happens when I archive an idea?',
];

export function AiChatEmptyState({
  onSuggestion,
  showNewChat,
  isLoading,
  isWidget,
}: Props) {
  const { mutate: createSession, isPending } = useCreateSessionMutation();
  const suggestionsToShow = isWidget ? suggestions.slice(0, 2) : suggestions;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={cn(
            'bg-brand-dark-blue flex items-center justify-center rounded-2xl shadow-md',
            isWidget ? 'h-10 w-10' : 'h-14 w-14',
          )}
        >
          <NetworkIntelligence
            className={cn('text-white', isWidget ? 'size-6' : 'size-8')}
          />
        </div>
        <h2
          className={cn(
            'text-foreground font-semibold',
            isWidget ? 'text-base' : 'text-lg',
          )}
        >
          Ask about your ideas &amp; problems
        </h2>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {suggestionsToShow.map(suggestion => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            disabled={isLoading}
            className={cn(
              'border-border bg-card hover:border-brand-dark-blue/30 hover:bg-brand-dark-blue/4',
              'text-muted-foreground rounded-xl border text-left',
              'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
              isWidget ? 'p-2 text-xs' : 'px-4 py-2.5 text-sm',
            )}
          >
            {suggestion}
          </button>
        ))}

        {showNewChat && (
          <button
            type="button"
            onClick={() => createSession(undefined)}
            disabled={isPending || isLoading}
            className={cn(
              'border-border bg-card hover:border-brand-dark-blue/30 hover:bg-brand-dark-blue/4',
              'text-muted-foreground mt-2 rounded-xl border px-4 py-2.5 text-center text-sm font-medium',
              'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            + New chat
          </button>
        )}
      </div>
    </div>
  );
}
