import { cn } from '@/shared/lib/utils';

type Props = {
  action: {
    field: 'tags' | 'linked_problems';
    suggested: string[];
    existing: string[];
  };
  onApply: (merged: string[]) => void;
  onSkip: () => void;
};

export function FieldActionCard({ action, onApply, onSkip }: Props) {
  const newValues = action.suggested.filter(v => !action.existing.includes(v));
  const newCount = newValues.length;
  const label = action.field === 'tags' ? 'Tags' : 'Problems';

  const merged = [
    ...action.existing,
    ...newValues,
  ];

  return (
    <div className={cn(
      'border-border bg-muted/50 flex items-center gap-2 border-t px-3 py-2 text-xs',
    )}>
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1 overflow-hidden">
        {action.suggested.slice(0, 4).map(v => (
          <span
            key={v}
            className="bg-background border-border text-foreground max-w-[80px] truncate rounded border px-1.5 py-0.5"
          >
            {v}
          </span>
        ))}
        {action.suggested.length > 4 && (
          <span className="text-muted-foreground">+{action.suggested.length - 4}</span>
        )}
        {newCount > 0 && (
          <span className="text-muted-foreground shrink-0">+{newCount} new</span>
        )}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
      >
        Skip
      </button>
      <button
        type="button"
        onClick={() => onApply(merged)}
        className="text-brand-dark-blue dark:text-primary shrink-0 font-medium transition-opacity hover:opacity-80"
      >
        Add
      </button>
    </div>
  );
}
