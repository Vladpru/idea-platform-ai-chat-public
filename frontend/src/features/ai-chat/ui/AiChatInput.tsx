import { ArrowUp, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

type Props = {
  onSend: (message: string) => void;
  isStreaming: boolean;
  restoredValue?: string;
};

export function AiChatInput({ onSend, isStreaming, restoredValue }: Props) {
  const [value, setValue] = useState(restoredValue ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSend(trimmed);
  };

  const canSend = !!value.trim() && !isStreaming;

  return (
    <div className="shrink-0 px-4 pt-2 pb-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            'border-border bg-card flex items-center gap-3 rounded-2xl border px-4 py-3',
            'focus-within:border-brand-dark-blue/50 transition-colors',
          )}
        >
          <textarea
            id="ai-chat-input"
            ref={textareaRef}
            value={value}
            onChange={e => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="What can I help you with?"
            disabled={isStreaming}
            rows={1}
            className={cn(
              'text-foreground flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none',
              'placeholder:text-muted-foreground/50 disabled:opacity-40',
            )}
            style={{ maxHeight: 140 }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-150',
              canSend
                ? 'bg-brand-dark-blue cursor-pointer text-white shadow-sm hover:opacity-90 active:scale-95'
                : 'bg-muted text-muted-foreground/40 cursor-not-allowed',
            )}
          >
            {isStreaming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowUp size={14} />
            )}
          </button>
        </div>
        <p className="text-muted-foreground/40 mt-1.5 text-center text-[11px]">
          Responses are automated based on internal knowledge bases and may
          contain inaccuracies
        </p>
      </div>
    </div>
  );
}
