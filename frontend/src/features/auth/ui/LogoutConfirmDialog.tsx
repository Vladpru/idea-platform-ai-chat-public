import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { cn } from "@/shared/lib/utils";
import { useLogout } from "@/features/auth/lib/use-logout";

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "border-0 bg-white px-8 pb-8 pt-12 text-center text-foreground shadow-xl",
        )}
      >
        <button
          type="button"
          className={cn(
            "cursor-pointer absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md border-0 bg-transparent text-foreground opacity-70 transition-colors hover:bg-muted hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          aria-label="Close"
          onClick={() => {
            onOpenChange(false);
          }}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <AlertDialogHeader className="items-center space-y-3 sm:text-center">
          <AlertDialogTitle className="text-xl font-semibold">
            Do you really want to Log out?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground">
            Remember, you can come back at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <AlertDialogAction
            type="button"
            className={cn(
              "inline-flex min-w-[154px] items-center justify-center rounded-sm border border-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            onClick={() => {
              logout();
            }}
          >
            YES
          </AlertDialogAction>
          <AlertDialogCancel
            type="button"
            className={cn(
              "inline-flex min-w-[154px] items-center justify-center rounded-sm border border-primary  px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            NO
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
