import { CircleHelp, X } from 'lucide-react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

const BADGE_RULES: { key: string; name: string; description: string }[] = [
  { key: 'innovator', name: 'Innovator', description: 'Create 3+ ideas' },
  {
    key: 'collaborator',
    name: 'Collaborator',
    description: 'Join 10+ ideas/problems/products',
  },
  {
    key: 'active_voice',
    name: 'Active Voice',
    description: 'Add 10+ comments',
  },
  { key: 'completer', name: 'Completer', description: 'Complete 5+ ideas' },
  { key: 'connector', name: 'Connector', description: 'Invite 5+ users' },
  {
    key: 'top_contributor',
    name: 'Top Contributor (Monthly)',
    description: 'Achieve the highest score in a month',
  },
];

export function AchievementsHowItWorksModal() {
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
            How Achievements work
          </DialogTitle>
        </DialogHeader>
        <p className="text-brand-gray-600 text-center text-sm">
          Achievements recognize your ongoing contributions — from sharing ideas
          to completing projects. Each badge marks a milestone on your path to
          becoming a top innovator.
        </p>
        <div className="mt-1 overflow-hidden border border-gray-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-light-blue">
                <th className="text-brand-dark-blue px-4 py-3 text-left font-semibold">
                  Badge
                </th>
                <th className="text-brand-dark-blue px-4 py-3 text-left font-semibold">
                  How to earn it
                </th>
              </tr>
            </thead>
            <tbody>
              {BADGE_RULES.map(({ key, name, description }) => (
                <tr key={key} className="border-brand-light-blue border-t">
                  <td className="text-brand-gray-700 px-4 py-3">{name}</td>
                  <td className="text-brand-gray-700 px-4 py-3">
                    {description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
