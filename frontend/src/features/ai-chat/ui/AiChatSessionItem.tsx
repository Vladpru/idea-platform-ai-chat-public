import { Link } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { ConfirmDeleteModal } from '@/shared/ui/confirm-delete-modal';

import type { ChatSession } from '../api/ai-chat.types';
import { useDeleteSessionMutation } from '../hooks/mutations/use-delete-session-mutation';
import { useChatStreamStore } from '../model/chat-stream-store';

type Props = {
  session: ChatSession;
  isActive: boolean;
  onDeleted?: () => void;
};

export function AiChatSessionItem({ session, isActive, onDeleted }: Props) {
  const [hovered, setHovered] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: deleteSession, isPending } = useDeleteSessionMutation();
  const isStreaming = useChatStreamStore(state => state.sessions[session.id]?.isStreaming ?? false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    deleteSession(session.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        onDeleted?.();
      },
    });
  };

  return (
    <>
      <Link
        to="/ai-chat/$sessionId"
        params={{ sessionId: session.id }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150',
          isActive
            ? 'bg-brand-dark-blue/8 dark:bg-brand-dark-blue/20 text-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {session.title ?? 'New conversation'}
        </span>
        {isStreaming && !isActive && (
          <span className="flex shrink-0 items-center gap-0.5" aria-label="AI is responding">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="bg-brand-dark-blue/60 size-1 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
        )}
        {(hovered || isPending) && !isStreaming && (
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isPending}
            className="text-muted-foreground/50 hover:text-destructive shrink-0 rounded p-0.5 transition-colors"
            aria-label="Delete session"
          >
            <Trash2 size={14} />
          </button>
        )}
      </Link>

      <ConfirmDeleteModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete conversation?"
        description={`"${session.title ?? 'New conversation'}" and all its messages will be permanently deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  );
}
