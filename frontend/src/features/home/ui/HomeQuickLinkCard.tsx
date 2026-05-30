import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

type HomeQuickLinkCardProps = {
  to: string;
  search?: Record<string, string>;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClassName?: string;
};

export function HomeQuickLinkCard({
  to,
  search,
  title,
  description,
  icon: Icon,
  accentClassName,
}: HomeQuickLinkCardProps) {
  return (
    <Link
      to={to}
      search={search}
      className="border-brand-gray-200 group focus-visible:ring-brand-dark-blue flex h-full flex-col rounded-lg border bg-white p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <span
        className={cn(
          'bg-brand-light-blue text-brand-dark-blue mb-4 flex size-10 items-center justify-center rounded-md',
          accentClassName,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="text-brand-dark-blue text-base font-bold">{title}</h3>
      <p className="text-brand-gray-700 mt-2 flex-1 text-sm">{description}</p>
      <span className="text-brand-orange mt-4 inline-flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
        Open
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
