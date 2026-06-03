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
        'group text-brand-dark-blue dark:text-brand-light-blue inline-flex items-center gap-1 text-xs font-semibold tracking-wide transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <SparklesIcon className="group-hover:text-brand-dark-blue/80 dark:group-hover:text-brand-light-blue/80 size-5 transition-colors" />
      <span className="group-hover:text-brand-dark-blue/80 dark:group-hover:text-brand-light-blue/80 transition-colors">
        {children}
      </span>
    </button>
  );
}
