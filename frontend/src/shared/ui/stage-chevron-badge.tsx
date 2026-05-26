import { cn } from '@/shared/lib/utils';

function normalizeStageKey(stage: string | null | undefined): string {
  if (stage == null || typeof stage !== 'string') return '';
  return stage.trim().toUpperCase().replace(/\s+/g, '_');
}

const STAGE_CHEVRON_CONFIGS: Record<
  string,
  { color: string; label: string }[]
> = {
  IDEATION: [
    { color: '#FFA900', label: 'Ideation' },
    { color: '#2B787C', label: '' },
    { color: '#75A04A', label: '' },
  ],
  PROTOTYPING: [
    { color: '#FFA900', label: '' },
    { color: '#2B787C', label: 'Prototyping' },
    { color: '#75A04A', label: '' },
  ],
  ACTIVE: [
    { color: '#2B787C', label: 'Active' },
    { color: '#75A04A', label: '' },
    { color: '#8E3F8A', label: '' },
  ],
  PAUSED: [
    { color: '#FFA900', label: '' },
    { color: '#2B787C', label: '' },
    { color: '#4E6374', label: 'Paused' },
  ],
  COMPLETED: [
    { color: '#2B787C', label: '' },
    { color: '#72A849', label: 'Completed' },
    { color: '#8E3F8A', label: '' },
  ],
  ARCHIVED: [
    { color: '#9CA3AF', label: '' },
    { color: '#6B7280', label: '' },
    { color: '#4B5563', label: 'Archived' },
  ],
};

const DEFAULT_SEGMENTS = (label: string) => [
  { color: '#9CA3AF', label },
  { color: '#D1D5DB', label: '' },
  { color: '#E5E7EB', label: '' },
];

export type StageChevronBadgeProps = {
  stage?: string | null;
  className?: string;
  stageText?: boolean;
  compact?: boolean;
};

export function StageChevronBadge({
  stage,
  className,
  stageText = true,
  compact = false,
}: StageChevronBadgeProps) {
  if (!stage?.trim()) return null;

  const trimmed = stage.trim();
  const key = normalizeStageKey(trimmed);
  const segments = STAGE_CHEVRON_CONFIGS[key] ?? DEFAULT_SEGMENTS(trimmed);

  const offset = compact ? 8 : 12;
  const flatLeftClip = `polygon(0 0, calc(100% - ${offset}px) 0, 100% 50%, calc(100% - ${offset}px) 100%, 0 100%)`;
  const chevronClip = `polygon(0 0, calc(100% - ${offset}px) 0, 100% 50%, calc(100% - ${offset}px) 100%, 0 100%, ${offset}px 50%)`;

  return (
    <div
      className={cn(
        'flex items-stretch',
        compact ? 'h-[18px]' : 'h-[24px]',
        className,
      )}
    >
      {stageText && (
        <div
          className={cn(
            'relative z-50 flex items-center justify-center font-medium tracking-wide text-gray-600',
            compact ? 'pr-3 text-[10px]' : 'pr-4 text-[13px]',
          )}
          style={{ clipPath: flatLeftClip }}
        >
          Stage
        </div>
      )}

      {segments.map((segment, index) => {
        const hasText = segment.label !== '';
        return (
          <div
            key={index}
            className={cn(
              'relative flex items-center justify-center font-medium tracking-wide text-white',
              compact ? 'text-[10px]' : 'text-[13px]',
            )}
            style={{
              backgroundColor: segment.color,
              clipPath: chevronClip,
              marginLeft: compact ? '-6px' : '-10px',
              zIndex: segments.length - index,
              width: hasText ? undefined : compact ? '18px' : '23px',
              paddingLeft: hasText ? (compact ? '12px' : '20px') : undefined,
              paddingRight: hasText ? (compact ? '12px' : '20px') : undefined,
            }}
          >
            {segment.label}
          </div>
        );
      })}
    </div>
  );
}
