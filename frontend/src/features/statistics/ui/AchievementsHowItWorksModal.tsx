import { CircleHelp } from 'lucide-react';

import activeVoiceIconUrl from '@/features/achievements/public/ActiveVoice.svg';
import collaboratorIconUrl from '@/features/achievements/public/Collaborator.svg';
import completerIconUrl from '@/features/achievements/public/Completer.svg';
import connectorIconUrl from '@/features/achievements/public/Connector.svg';
import innovatorIconUrl from '@/features/achievements/public/Innovator.svg';
import topContributorIconUrl from '@/features/achievements/public/TopContributor.svg';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

const BADGE_RULES: { key: string; name: string; iconUrl: string; description: string }[] = [
  {
    key: 'innovator',
    name: 'Innovator',
    iconUrl: innovatorIconUrl,
    description: 'Publish 5 ideas',
  },
  {
    key: 'active_voice',
    name: 'Active Voice',
    iconUrl: activeVoiceIconUrl,
    description: 'Create 10 comments',
  },
  {
    key: 'collaborator',
    name: 'Collaborator',
    iconUrl: collaboratorIconUrl,
    description: 'Join 10 projects',
  },
  {
    key: 'completer',
    name: 'Completer',
    iconUrl: completerIconUrl,
    description: 'Complete 3 ideas',
  },
  {
    key: 'connector',
    name: 'Connector',
    iconUrl: connectorIconUrl,
    description: 'Invite 5 users',
  },
  {
    key: 'top_contributor',
    name: 'Top Contributor',
    iconUrl: topContributorIconUrl,
    description: 'Finish 1st on the monthly leaderboard',
  },
];

export function AchievementsHowItWorksModal() {
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>How achievements work</DialogTitle>
        </DialogHeader>
        <p className="text-brand-gray-700 text-sm">
          Earn badges by hitting contribution milestones:
        </p>
        <ul className="space-y-3">
          {BADGE_RULES.map(({ key, name, iconUrl, description }) => (
            <li key={key} className="flex items-center gap-3">
              <img src={iconUrl} alt="" aria-hidden className="size-9 shrink-0" />
              <div className="min-w-0">
                <p className="text-brand-black text-sm font-bold">{name}</p>
                <p className="text-brand-gray-500 text-xs">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
