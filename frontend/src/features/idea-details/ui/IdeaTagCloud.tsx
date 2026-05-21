import { cn } from '@/shared/lib/utils';

type IdeaTagCloudProps = {
  tags: string[];
  className?: string;
  tagToShowCount?: number;
};

export function IdeaTagCloud({
  tags,
  className,
  tagToShowCount = 20,
}: IdeaTagCloudProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, tagToShowCount);
  const remainingCount = tags.length - tagToShowCount;

  return (
    <ul
      className={cn('flex flex-wrap items-center gap-2', className)}
      aria-label="Idea tags"
    >
      {visibleTags.map(tag => (
        <li key={tag}>
          <span className="bg-brand-gray-200 text-brand-gray-600 font-arial inline-flex items-center rounded-lg border px-1.75 py-0.75 text-xs font-normal">
            {tag}
          </span>
        </li>
      ))}

      {remainingCount > 0 && (
        <li>
          <span className="bg-brand-gray-200 text-brand-gray-600 font-arial inline-flex items-center rounded-lg border px-1.75 py-0.75 text-xs font-normal">
            +{remainingCount}
          </span>
        </li>
      )}
    </ul>
  );
}
