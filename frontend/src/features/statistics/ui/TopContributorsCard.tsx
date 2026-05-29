import { getInitials } from '@/features/idea-details/lib/get-initials';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/ui/avatar';
import { Star } from 'lucide-react';

import type { TopContributor } from '../model/statistics.types';

import { statisticsCardClass, statisticsIconTileClass } from './statistics-classes';

type TopContributorsCardProps = {
  contributors: TopContributor[];
};

export function TopContributorsCard({ contributors }: TopContributorsCardProps) {
  return (
    <section className={`${statisticsCardClass} h-full w-full`}>
      <div className="mb-5 flex items-center gap-3">
        <span className={statisticsIconTileClass}>
          <Star className="size-5" aria-hidden />
        </span>
        <h2 className="text-brand-dark-blue text-lg font-bold">Top contributors</h2>
      </div>
      {contributors.length === 0 ? (
        <p className="text-brand-gray-500 text-sm">No contributor data yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {contributors.map((contributor) => (
            <li key={contributor.id} className="flex items-center gap-3">
              <Avatar size="lg" className="size-11">
                {contributor.avatarUrl ? (
                  <AvatarImage src={contributor.avatarUrl} alt={contributor.name} />
                ) : null}
                <AvatarFallback className="bg-brand-light-blue text-brand-dark-blue text-sm font-semibold">
                  {getInitials(contributor.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-brand-black truncate text-sm font-bold">
                  {contributor.name}
                </p>
                <p className="text-brand-gray-500 text-xs tabular-nums">
                  {contributor.score} score
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
