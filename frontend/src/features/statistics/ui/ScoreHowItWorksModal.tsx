import { CircleHelp, X } from 'lucide-react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '@/shared/ui/dialog';

const SCORE_RULES: { label: string; points: number }[] = [
  { label: 'Create idea', points: 50 },
  { label: 'Join idea', points: 20 },
  { label: 'Update idea', points: 15 },
  { label: 'Invite collaborator', points: 25 },
  { label: 'Comment on idea', points: 5 },
  { label: 'New badge earned', points: 10 },
  { label: 'Like idea', points: 3 },
  { label: 'View idea', points: 1 },
];

export function ScoreHowItWorksModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-brand-dark-blue hover:text-brand-dark-blue/80 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase transition-colors"
        >
          How it works
          <CircleHelp className="size-4" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogClose className="text-brand-gray-500 hover:text-brand-black absolute top-4 right-4 z-10 transition-colors">
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="px-8 pt-8 pb-6 text-center">
          <h2 className="text-brand-dark-blue text-xl font-bold">
            How Points work
          </h2>
          <p className="text-brand-gray-500 mt-2 text-sm leading-relaxed">
            Earn points by contributing to ideas on the platform.
            <br />
            Points reset monthly and determine your leaderboard rank.
          </p>
        </div>

        <div className="px-8 pb-8">
          <div className="border-brand-gray-200 overflow-hidden rounded-xl border">
            <div className="bg-brand-gray-50 dark:bg-brand-gray-100 grid grid-cols-2 px-4 py-2.5">
              <span className="text-brand-gray-500 text-xs font-semibold tracking-wide uppercase">
                Action
              </span>
              <span className="text-brand-gray-500 text-right text-xs font-semibold tracking-wide uppercase">
                Points
              </span>
            </div>

            {SCORE_RULES.map(({ label, points }) => (
              <div
                key={label}
                className="border-brand-gray-200 grid grid-cols-2 border-t px-4 py-3"
              >
                <span className="text-brand-black text-sm font-medium">
                  {label}
                </span>
                <span className="text-brand-dark-blue text-right text-sm font-bold tabular-nums">
                  +{points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
