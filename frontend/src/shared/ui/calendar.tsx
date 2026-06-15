import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';

import { cn } from '@/shared/lib/utils';

import 'react-day-picker/style.css';
import { buttonVariants } from './button-variants';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-0', className)}
      classNames={{
        // `Months` is the positioning context; the single `Nav` (which holds
        // both chevrons) is rendered as its first child, so we overlay it on
        // top of the caption row instead of absolutely positioning each button.
        months: 'relative flex flex-col gap-4',
        month: 'space-y-4',
        month_caption: 'flex h-9 items-center justify-center',
        caption_label: 'text-sm font-medium',
        nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between px-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-70 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-70 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground w-9 rounded-md text-[0.8rem] font-normal',
        week: 'mt-2 flex w-full',
        day: 'relative p-0 text-center text-sm',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-9 p-0 font-normal aria-selected:opacity-100',
        ),
        selected:
          'bg-brand-orange text-white hover:bg-brand-orange hover:text-white focus:bg-brand-orange focus:text-white',
        today: 'bg-brand-gray-100 text-brand-dark-blue',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="size-4" />;
          }

          return <ChevronRight className="size-4" />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
