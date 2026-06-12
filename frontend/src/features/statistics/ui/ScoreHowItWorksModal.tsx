import { CircleHelp, X } from 'lucide-react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

const SCORE_RULES: { label: string; points: number }[] = [
  { label: 'New badge earned', points: 200 },
  { label: 'Complete idea', points: 100 },
  { label: 'Create idea/problem/product', points: 50 },
  { label: 'Join idea/problem/product', points: 20 },
  { label: 'Create update for idea/problem/product', points: 15 },
  { label: 'Invite collaborator', points: 15 },
  { label: 'Comment idea/problem/product', points: 5 },
  { label: 'Like idea/problem/product', points: 3 },
  { label: 'View idea/problem/product', points: 1 },
];

export function ScoreHowItWorksModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-brand-dark-blue hover:text-brand-dark-blue/80 inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold tracking-wide uppercase transition-colors"
        >
          How it works
          <CircleHelp className="size-4" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="border-brand-gray-600 max-w-2xl rounded-sm">
        <DialogClose className="text-brand-gray-500 hover:text-brand-gray-700 absolute top-4 right-6 transition-colors">
          <X className="size-5" aria-hidden />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            How Points work
          </DialogTitle>
        </DialogHeader>
        <p className="text-brand-gray-600 text-center text-sm">
          Contribute ideas, solve problems, and support others.
          <br />
          The more you participate, the higher your score — and the greater your
          impact on innovation.
        </p>
        <div className="mt-1 overflow-hidden border border-gray-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-light-blue">
                <th className="text-brand-dark-blue px-4 py-3 text-left font-semibold">
                  Action
                </th>
                <th className="text-brand-dark-blue px-4 py-3 text-left font-semibold">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {SCORE_RULES.map(({ label, points }) => (
                <tr key={label} className="border-t border-gray-200">
                  <td className="text-brand-gray-700 px-4 py-3">{label}</td>
                  <td className="text-brand-gray-700 px-4 py-3">+{points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
