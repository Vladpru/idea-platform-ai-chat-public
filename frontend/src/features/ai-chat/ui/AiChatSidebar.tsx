import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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
        'flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-13',
      )}
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-border',
          isOpen ? 'gap-1.5 px-3' : 'flex-col justify-center gap-1 py-2',
        )}
      >
        {isOpen ? (
          <>
            <button
              type="button"
              onClick={() => createSession()}
              disabled={isPending}
              className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <Plus size={15} className="text-brand-dark-blue shrink-0" />
              New Chat
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => createSession()}
              disabled={isPending}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              aria-label="New chat"
            >
              <Plus size={15} />
            </button>
          </>
        )}
      </div>

      {isOpen && (
        <div className="flex flex-1 flex-col overflow-y-auto py-3">
          {groups.map(group => (
            <div key={group.label} className="mb-2">
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5 px-2">
                {group.items.map(session => (
                  <AiChatSessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    onDeleted={() => handleDeleted(session.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
