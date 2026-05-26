import { Skeleton } from '@/shared/ui/skeleton';

const PARAGRAPH_LINES = [
  ['w-full', 'w-[95%]', 'w-[88%]', 'w-[72%]'],
  ['w-[90%]', 'w-[80%]', 'w-[55%]'],
] as const;

export function IdeaDescriptionSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {PARAGRAPH_LINES.map((lines, paragraphIndex) => (
        <div key={paragraphIndex} className="space-y-3">
          {lines.map((width, lineIndex) => (
            <Skeleton
              key={`${paragraphIndex}-${lineIndex}`}
              className={`h-4 ${width}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
