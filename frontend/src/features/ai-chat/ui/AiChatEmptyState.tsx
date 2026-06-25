import { Bot } from 'lucide-react';

import { Button } from '@/shared/ui/button';

type Props = {
  onNewChat: () => void;
  isLoading?: boolean;
};

export function AiChatEmptyState({ onNewChat, isLoading }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-brand-dark-blue flex h-16 w-16 items-center justify-center rounded-2xl">
        <Bot size={32} className="text-white" />
      </div>
      <div>
        <h2 className="text-foreground text-lg font-semibold">AI Assistant</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Ask anything about the Idea Platform — ideas, problems, workflows, or team stats.
        </p>
      </div>
      <Button onClick={onNewChat} disabled={isLoading}>
        Start a conversation
      </Button>
    </div>
  );
}
