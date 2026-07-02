import { Sparkles } from 'lucide-react';

type Props = {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isWidget?: boolean;
};

export function AiChatSuggestions({ suggestions, onSelect, isWidget }: Props) {
  if (!suggestions.length) return null;

  const visible = isWidget ? suggestions.slice(0, 1) : suggestions;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {visible.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(s)}
          className="border-border text-foreground/70 hover:border-brand-dark-blue/40 hover:text-foreground bg-card/60 hover:bg-card/80 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur-md transition-colors"
        >
          <Sparkles className="text-brand-dark-blue size-3 shrink-0" />
          {s}
        </button>
      ))}
    </div>
  );
}
