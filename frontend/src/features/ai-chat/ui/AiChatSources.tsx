import { FileText } from 'lucide-react';

import type { ChatMessageSource } from '../api/ai-chat.types';

export function AiChatSources({ sources }: { sources: ChatMessageSource[] }) {
  if (!sources.length) return null;

  const maxRelevance = Math.max(...sources.map(s => s.relevance));

  return (
    <div className="mt-3 border-t border-border/50 pt-2.5">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 transition-colors hover:border-brand-dark-blue/30"
          >
            <FileText size={11} className="shrink-0 text-muted-foreground" />
            <span className="max-w-40 truncate text-xs text-foreground/80">
              {source.title}
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground/70">
              {maxRelevance > 0 ? Math.round((source.relevance / maxRelevance) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
