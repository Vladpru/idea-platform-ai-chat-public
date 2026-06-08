import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { CircleHelp } from 'lucide-react';

const SCORE_RULES = [
  'Create idea — 50 points',
  'Join idea — 20 points',
  'Update idea — 15 points',
  'Comment on idea — 5 points',
  'Like idea — 3 points',
  'View idea — 1 point',
];

type StatisticsHowItWorksLinkProps = {
  label?: string;
};

export function StatisticsHowItWorksLink({
  label = 'How it works',
}: StatisticsHowItWorksLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-brand-dark-blue hover:text-brand-dark-blue/80 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase transition-colors"
        >
          {label}
          <CircleHelp className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        className="border-brand-gray-200 bg-card text-brand-black max-w-xs border px-3 py-2.5"
      >
        <p className="text-brand-gray-700 mb-2 text-xs font-semibold">
          Points are earned for idea activity in the selected time range:
        </p>
        <ul className="space-y-1 text-xs">
          {SCORE_RULES.map(rule => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
