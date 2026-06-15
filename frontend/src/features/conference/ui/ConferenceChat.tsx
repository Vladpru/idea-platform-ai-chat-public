import { useChat, useLocalParticipant } from '@livekit/components-react';
import type { ReceivedChatMessage } from '@livekit/components-react';
import {
  nameInitial,
  useAuthSessionStore,
} from '@/features/auth/model/auth-session-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ChatBubble({
  entry,
  isLocal,
}: {
  entry: ReceivedChatMessage;
  isLocal: boolean;
}) {
  const name = entry.from?.name ?? 'Anonymous';
  const avatarUrl = entry.attributes?.avatarUrl || null;

  return (
    <div className={cn('flex gap-2', isLocal && 'flex-row-reverse')}>
      <Avatar size="sm" className="mt-0.5 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="bg-zinc-200 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {nameInitial(name)}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex max-w-[75%] flex-col gap-0.5',
          isLocal && 'items-end',
        )}
      >
        <div
          className={cn(
            'flex items-baseline gap-1.5',
            isLocal && 'flex-row-reverse',
          )}
        >
          <span className="text-xs leading-none font-medium text-zinc-700 dark:text-zinc-300">
            {name}
          </span>
          <span className="text-[10px] leading-none text-zinc-400 dark:text-zinc-500">
            {formatTimestamp(entry.timestamp)}
          </span>
        </div>

        <div
          className={cn(
            'rounded-xl px-3 py-2 text-sm leading-snug',
            isLocal
              ? 'bg-brand-orange rounded-tr-sm text-white'
              : 'rounded-tl-sm bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
          )}
        >
          {entry.message}
        </div>
      </div>
    </div>
  );
}

type ConferenceChatProps = {
  className?: string;
};

export function ConferenceChat({ className }: ConferenceChatProps) {
  const { chatMessages, send, isSending } = useChat();
  const { localParticipant } = useLocalParticipant();
  const currentUser = useAuthSessionStore(state => state.user);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText('');
    await send(text, {
      attributes: { avatarUrl: currentUser?.picture ?? '' },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border-l border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/60',
        className,
      )}
    >
      <div className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Chat
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {chatMessages.length === 0 ? (
          <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No messages yet.
          </p>
        ) : (
          chatMessages.map(msg => (
            <ChatBubble
              key={msg.id}
              entry={msg}
              isLocal={msg.from?.identity === localParticipant.identity}
            />
          ))
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message…"
          maxLength={1000}
          className="h-9 border-0 bg-zinc-100 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-orange-500 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
        />
        <Button
          type="button"
          size="icon"
          className="bg-brand-orange hover:bg-brand-orange/90 size-9 shrink-0"
          disabled={!inputText.trim() || isSending}
          onClick={() => void handleSend()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
