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
        'group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-brand-dark-blue/10 text-foreground border-brand-dark-blue border-l-2 font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span className="min-w-0 flex-1 truncate">
        {session.title ?? 'New conversation'}
      </span>
      {(hovered || isPending) && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
          aria-label="Delete session"
        >
          <Trash2 size={13} />
        </button>
      )}
    </Link>
  );
}
