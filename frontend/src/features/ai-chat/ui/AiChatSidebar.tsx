import { ChevronLeft, ChevronRight, MessageSquarePlus } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';

import { cn } from '@/shared/lib/utils';

import type { ChatSession } from '../api/ai-chat.types';
import { useCreateSessionMutation } from '../hooks/mutations/use-create-session-mutation';
import { useSessionsQuery } from '../hooks/queries/use-sessions-query';
import { AiChatSessionItem } from './AiChatSessionItem';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
};

function groupByDate(sessions: ChatSession[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Older', items: [] },
  ];

  for (const session of sessions) {
    const d = new Date(session.updatedAt);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups[0].items.push(session);
    else if (d >= yesterday) groups[1].items.push(session);
    else groups[2].items.push(session);
  }

  return groups.filter(g => g.items.length > 0);
}

export function AiChatSidebar({ isOpen, onToggle }: Props) {
  const { data: sessions = [] } = useSessionsQuery();
  const { mutate: createSession, isPending } = useCreateSessionMutation();
  const navigate = useNavigate();

  const params = useParams({ strict: false }) as { sessionId?: string };
  const activeSessionId = params.sessionId;

  const handleDeleted = (deletedId: string) => {
    if (deletedId === activeSessionId) {
      const remaining = sessions.filter(s => s.id !== deletedId);
      if (remaining.length > 0) {
        navigate({ to: '/ai-chat/$sessionId', params: { sessionId: remaining[0].id } });
      } else {
        navigate({ to: '/ai-chat' });
      }
    }
  };

  const groups = groupByDate(sessions);

  return (
    <aside
      className={cn(
        'border-border bg-background flex flex-col border-r transition-all duration-200',
        isOpen ? 'w-60' : 'w-12',
      )}
    >
      <div className={cn('flex items-center p-2', isOpen ? 'justify-between' : 'justify-center')}>
        {isOpen && (
          <button
            type="button"
            onClick={() => createSession()}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            <MessageSquarePlus size={15} />
            <span>New Chat</span>
          </button>
        )}
        {!isOpen && (
          <button
            type="button"
            onClick={() => createSession()}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors hover:bg-muted"
            aria-label="New chat"
          >
            <MessageSquarePlus size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors hover:bg-muted"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-muted-foreground px-2 py-1 text-xs font-medium uppercase tracking-wider">
                {group.label}
              </p>
              {group.items.map(session => (
                <AiChatSessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onDeleted={() => handleDeleted(session.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
