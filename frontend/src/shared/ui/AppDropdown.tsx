import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { outlineBtnClass } from '@/features/ideas/lib/styles';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export type DropdownItem = {
  label: ReactNode;
  onSelect: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  icon?: ReactNode;
};

type AppDropdownProps = {
  items: DropdownItem[];
  trigger?: ReactNode;
  triggerLabel?: string;
  align?: 'start' | 'center' | 'end';
  contentClassName?: string;
};

export function AppDropdown({
  items,
  trigger,
  triggerLabel = 'Manage',
  align = 'end',
  contentClassName,
}: AppDropdownProps) {
  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        outlineBtnClass,
        'hover:bg-brand-blue-700 w-full gap-1.5 hover:text-white md:w-auto md:shrink-0',
      )}
    >
      {triggerLabel}
      <ChevronDown className="size-4" aria-hidden />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? defaultTrigger}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className={cn('w-44 rounded p-2', contentClassName)}
      >
        {items.map((item, index) => (
          <>
            {index > 0 && (
              <DropdownMenuSeparator key={`sep-${index}`} className="my-0" />
            )}
            <DropdownMenuItem
              key={index}
              disabled={item.disabled}
              className={cn(
                'cursor-pointer px-3 py-2 text-sm font-normal',
                item.variant === 'danger'
                  ? 'focus:bg-brand-orange/10 hover:bg-brand-orange/10 text-amber-600 focus:text-amber-600'
                  : 'focus:bg-brand-blue-700/10 hover:bg-brand-blue-700/10',
              )}
              onSelect={event => {
                event.preventDefault();
                item.onSelect();
              }}
            >
              {item.icon && (
                <span className="mr-2 flex items-center">{item.icon}</span>
              )}
              {item.label}
            </DropdownMenuItem>
          </>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
