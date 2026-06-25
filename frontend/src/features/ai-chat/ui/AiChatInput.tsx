import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type Props = {
  onSend: (message: string) => void;
  isStreaming: boolean;
  restoredValue?: string;
};

export function AiChatInput({ onSend, isStreaming, restoredValue }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (restoredValue !== undefined) setValue(restoredValue);
  }, [restoredValue]);

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

  return (
    <div className="border-border bg-background border-t px-4 py-3">
      <div className="border-border bg-muted flex items-end gap-2 rounded-xl border px-3 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => {
            setValue(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about the platform..."
          disabled={isStreaming}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground',
            'disabled:opacity-50',
          )}
          style={{ maxHeight: 140 }}
        />
        <Button
          type="button"
          size="icon"
          className="bg-brand-dark-blue hover:bg-brand-dark-blue/90 h-8 w-8 shrink-0 rounded-lg"
          disabled={!value.trim() || isStreaming}
          onClick={submit}
        >
          {isStreaming ? (
            <Loader2 size={14} className="animate-spin text-white" />
          ) : (
            <ArrowUp size={14} className="text-white" />
          )}
        </Button>
      </div>
      <p className="text-muted-foreground mt-1.5 text-center text-xs">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
