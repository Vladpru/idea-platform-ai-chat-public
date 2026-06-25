import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { cn } from '@/shared/lib/utils';

import type { ChatSession } from '../api/ai-chat.types';
import { useDeleteSessionMutation } from '../hooks/mutations/use-delete-session-mutation';

type Props = {
  session: ChatSession;
  isActive: boolean;
  onDeleted?: () => void;
};

export function AiChatSessionItem({ session, isActive, onDeleted }: Props) {
  const [hovered, setHovered] = useState(false);
  const { mutate: deleteSession, isPending } = useDeleteSessionMutation();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSession(session.id, { onSuccess: onDeleted });
  };

  return (
    <Link
      to="/ai-chat/$sessionId"
      params={{ sessionId: session.id }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150',
        isActive
          ? 'bg-accent text-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {isActive && (
        <div className="h-4 w-0.5 shrink-0 rounded-full bg-brand-dark-blue" />
      )}
      <span className={cn('min-w-0 flex-1 truncate', !isActive && 'pl-1')}>
        {session.title ?? 'New conversation'}
      </span>
      {(hovered || isPending) && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="shrink-0 rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-destructive"
          aria-label="Delete session"
        >
          <Trash2 size={13} />
        </button>
      )}
    </Link>
  );
}
