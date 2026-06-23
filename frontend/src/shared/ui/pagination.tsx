import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function buildPageItems(
  currentPage: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  const items: Array<number | 'ellipsis'> = [];
  const pushRange = (start: number, end: number) => {
    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }
  };

  if (totalPages <= 7) {
    pushRange(1, totalPages);
    return items;
  }

  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  items.push(1);
  if (left > 2) {
    items.push('ellipsis');
  }
  pushRange(left, right);
  if (right < totalPages - 1) {
    items.push('ellipsis');
  }
  items.push(totalPages);

  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = buildPageItems(currentPage, totalPages);

  return (
    <nav
      className={cn('mt-8 flex items-center justify-center gap-1.5', className)}
      aria-label="Pagination"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden />
        Previous
      </Button>

      <ul className="flex items-center gap-1">
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <li
              key={`ellipsis-${index}`}
              className="text-brand-gray-400 px-2 text-sm select-none"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Button
                type="button"
                variant={item === currentPage ? 'default' : 'outline'}
                size="sm"
                className="size-9 px-0 tabular-nums"
                aria-current={item === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ),
        )}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  );
}
