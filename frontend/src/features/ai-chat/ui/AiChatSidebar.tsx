import { useNavigate, useParams } from '@tanstack/react-router';

import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { cn } from '@/shared/lib/utils';

import type { ChatSession } from '../api/ai-chat.types';
import {
  EditSquare,
  LeftPanelCloseIcon,
  LeftPanelOpenIcon,
} from '../assets/SidebarIcons';
import { useCreateSessionMutation } from '../hooks/mutations/use-create-session-mutation';
import { useSessionsQuery } from '../hooks/queries/use-sessions-query';
import { AiChatSessionItem } from './AiChatSessionItem';
import { KbStatsPanel } from './KbStatsPanel';

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

function SidebarToggleButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg p-2 transition-colors"
      aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      {isOpen ? <LeftPanelCloseIcon /> : <LeftPanelOpenIcon />}
    </button>
  );
}

export function AiChatSidebar({ isOpen, onToggle }: Props) {
  const { data: sessions = [] } = useSessionsQuery();
  const isAdmin = useAuthSessionStore(s => s.user?.role === 'ADMIN');
  const { mutate: createSession, isPending } = useCreateSessionMutation();
  const navigate = useNavigate();

  const params = useParams({ strict: false }) as { sessionId?: string };
  const activeSessionId = params.sessionId;

  const handleDeleted = (deletedId: string) => {
    if (deletedId === activeSessionId) {
      const remaining = sessions.filter(s => s.id !== deletedId);
      if (remaining.length > 0) {
        navigate({
          to: '/ai-chat/$sessionId',
          params: { sessionId: remaining[0].id },
        });
      } else {
        navigate({ to: '/ai-chat' });
      }
    }
  };

  const groups = groupByDate(sessions);

  return (
    <aside
      className={cn(
        'border-border bg-card flex flex-col overflow-hidden border-r transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-13',
      )}
    >
      <div
        className={cn(
          'border-border flex shrink-0 items-center gap-1 border-b px-2',
          isOpen ? 'h-14 flex-row' : 'h-22 flex-col justify-center',
        )}
      >
        <button
          type="button"
          onClick={() => createSession(undefined)}
          disabled={isPending}
          className={cn(
            'flex min-w-0 items-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
            isOpen
              ? 'text-foreground hover:bg-accent hover:text-foreground/90 flex-1 px-2.5 py-2'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground p-2',
          )}
          aria-label="New chat"
        >
          <EditSquare
            className={cn(
              'size-4 shrink-0',
              isOpen ? 'text-brand-dark-blue' : 'text-black',
            )}
          />
          {isOpen && <span className="truncate">New Chat</span>}
        </button>
        <SidebarToggleButton isOpen={isOpen} onToggle={onToggle} />
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col overflow-y-auto py-3 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {groups.map(group => (
          <div key={group.label} className="mb-2">
            <p className="text-muted-foreground/60 px-4 py-1 text-[11px]">
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

      {isOpen && isAdmin && <KbStatsPanel />}
    </aside>
  );
}
