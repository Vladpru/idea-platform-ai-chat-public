import { FileText } from 'lucide-react';

import type { ChatMessageSource } from '../api/ai-chat.types';

export function AiChatSources({ sources }: { sources: ChatMessageSource[] }) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
          >
            <FileText size={13} className="shrink-0 text-brand-orange" />
            <span className="max-w-[180px] truncate text-xs text-foreground">
              {source.title}
            </span>
            <span className="rounded-full border border-brand-orange/30 bg-brand-orange/10 px-2 py-0.5 text-[10px] font-semibold text-brand-orange">
              {Math.round(source.relevance * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
