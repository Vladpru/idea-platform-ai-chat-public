import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { useLogout } from "@/features/auth/lib/use-logout";
import {
  nameInitial,
  useAuthSessionStore,
} from "@/features/auth/model/auth-session-store";

interface MobileMenuProps {
  triggerClassName: string;
}

const navLinkClass =
  "block px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-primary rounded-md";

export function MobileMenu({ triggerClassName }: MobileMenuProps) {
  const logout = useLogout();
  const user = useAuthSessionStore((s) => s.user);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={triggerClassName}
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-[300px] flex-col bg-white p-0 sm:w-[400px]"
      >
        <SheetHeader className="border-b border-primary p-4 text-left">
          <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Accordion
            type="multiple"
            defaultValue={["navigation", "profile"]}
            className="flex w-full flex-col gap-2"
          >
            <AccordionItem
              value="navigation"
              className="rounded-sm border border-slate-200 bg-non-active-background px-3"
            >
              <AccordionTrigger className="px-1 py-2 text-sm font-semibold text-primary hover:underline">
                Navigation
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-1 px-1 py-2">
                <Link
                  to="/problems"
                  className={navLinkClass}
                  activeProps={{
                    className: "bg-active-background text-primary",
                  }}
                >
                  Problems
                </Link>
                <Link
                  to="/ideas"
                  className={navLinkClass}
                  activeProps={{
                    className: "bg-active-background text-primary",
                  }}
                >
                  Ideas
                </Link>
                <Link
                  to="/statistics"
                  className={navLinkClass}
                  activeProps={{
                    className: "bg-active-background text-primary",
                  }}
                >
                  Statistics
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="profile"
              className="rounded-sm border border-slate-200 bg-non-active-background px-3"
            >
              <AccordionTrigger className="px-1 py-2 text-sm font-semibold text-primary hover:underline">
                Profile
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-1 px-1 py-2">
                <div className="mb-4 flex items-center gap-3 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.picture ?? undefined}
                      alt={user?.name || "User avatar"}
                    />
                    <AvatarFallback className="bg-slate-200 text-xs font-medium text-slate-800">
                      {nameInitial(user?.name ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-900">
                    {user?.name || "Unknown User"}
                  </span>
                </div>

                <Link
                  to="/profile/problems"
                  className={navLinkClass}
                  activeProps={{
                    className: "bg-active-background text-primary",
                  }}
                >
                  My Problems, Joins & Drafts
                </Link>
                <Link
                  to="/profile/ideas"
                  className={navLinkClass}
                  activeProps={{
                    className: "bg-active-background text-primary",
                  }}
                >
                  My Ideas, Joins & Drafts
                </Link>
                <Link
                  to="/profile"
                  className={navLinkClass}
                  activeProps={{
                    className: "bg-active-background text-primary",
                  }}
                >
                  Settings
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="mt-2 px-3 text-left text-sm font-bold text-brand-accent hover:opacity-80"
                    >
                      Log out
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[90%] rounded-md sm:max-w-[425px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-center text-xl font-bold text-primary">
                        Do you really want to Log out?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-center text-sm text-slate-500">
                        Remember, you can come back at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row items-center justify-center gap-3 sm:justify-center">
                      <AlertDialogAction
                        onClick={logout}
                        className="w-24 text-primary hover:bg-slate-50"
                      >
                        YES
                      </AlertDialogAction>
                      <AlertDialogCancel className="mt-0 w-24 border-primary text-primary">
                        NO
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="mt-auto flex flex-col gap-3 p-4 pt-0">
          <Button
            variant="outline"
            className="w-full border-primary text-xs font-bold uppercase tracking-wide text-primary"
          >
            ADD NEW PROBLEM
          </Button>
          <Button className="w-full bg-brand-accent text-xs font-bold uppercase tracking-wide text-white hover:opacity-90">
            ADD NEW IDEA
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
