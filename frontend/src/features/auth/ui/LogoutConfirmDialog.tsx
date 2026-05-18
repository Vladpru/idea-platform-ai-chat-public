import { useLogout } from '@/features/auth/lib/use-logout';
import { X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

const outlineActionClass =
  'border-brand-dark-blue text-brand-dark-blue hover:bg-brand-dark-blue/10 dark:border-brand-light-blue dark:text-brand-light-blue dark:hover:bg-brand-light-blue/10 inline-flex min-w-[154px] items-center justify-center rounded-sm border bg-transparent px-6 py-2.5 text-sm font-semibold tracking-wide uppercase';

export interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
}: LogoutConfirmDialogProps) {
  const logout = useLogout();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'bg-card text-card-foreground max-w-lg px-8 pt-12 pb-8 text-center shadow-xl',
        )}
      >
        <DialogClose
          className={cn(
            'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring absolute top-3 right-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </DialogClose>
        <DialogHeader className="items-center space-y-3 sm:text-center">
          <DialogTitle className="text-card-foreground text-xl font-semibold">
            Do you really want to Log out?
          </DialogTitle>
          <DialogDescription className="text-base">
            Remember, you can come back at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            className={outlineActionClass}
            onClick={() => {
              logout();
            }}
          >
            YES
          </Button>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className={outlineActionClass}
            >
              NO
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
