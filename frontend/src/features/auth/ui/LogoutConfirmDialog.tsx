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
          'text-foreground max-w-lg border-0 bg-white px-8 pt-12 pb-8 text-center shadow-xl',
        )}
      >
        <DialogClose
          className={cn(
            'text-foreground hover:bg-muted focus-visible:ring-ring absolute top-3 right-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent opacity-70 transition-colors hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2',
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </DialogClose>
        <DialogHeader className="items-center space-y-3 sm:text-center">
          <DialogTitle className="text-xl font-semibold">
            Do you really want to Log out?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Remember, you can come back at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            className={cn(
              'border-primary text-primary hover:bg-primary/10 focus-visible:ring-ring inline-flex min-w-[154px] items-center justify-center rounded-sm border px-6 py-2.5 text-sm font-semibold tracking-wide uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            )}
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
              className={cn(
                'border-primary text-primary hover:bg-primary/10 focus-visible:ring-ring inline-flex min-w-[154px] items-center justify-center rounded-sm border px-6 py-2.5 text-sm font-semibold tracking-wide uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              )}
            >
              NO
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
