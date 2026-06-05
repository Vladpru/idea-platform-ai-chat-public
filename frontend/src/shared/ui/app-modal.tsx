import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

export type AppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  preventClose?: boolean;
};

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  preventClose = false,
}: AppModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && preventClose) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'border-border bg-card text-card-foreground max-w-md gap-0 rounded-lg border p-8 shadow-xl sm:max-w-[480px]',
          className,
        )}
        onPointerDownOutside={event => {
          if (preventClose) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={event => {
          if (preventClose) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="space-y-3 text-center">
          <DialogTitle className="text-foreground text-xl font-bold">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
