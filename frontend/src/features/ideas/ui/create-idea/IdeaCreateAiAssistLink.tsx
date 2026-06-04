import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';

import { cn } from '@/shared/lib/utils';

type IdeaCreateAiAssistLinkProps = {
  children: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function IdeaCreateAiAssistLink({
  children,
  onClick,
  disabled = false,
}: IdeaCreateAiAssistLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group text-primary inline-flex items-center gap-1 text-xs font-semibold tracking-wide transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <SparklesIcon className="size-5 transition-colors group-hover:text-primary/80" />
      <span className="transition-colors group-hover:text-primary/80">
        {children}
      </span>
    </button>
  );
}
