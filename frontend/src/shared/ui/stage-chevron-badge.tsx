import { cn } from '@/shared/lib/utils';

export function normalizeStageKey(stage: string | null | undefined): string {
  if (stage == null || typeof stage !== 'string') return '';
  return stage.trim().toUpperCase().replace(/\s+/g, '_');
}

const FLAT_LEFT_CLIP =
  'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)';
const CHEVRON_CLIP =
  'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)';

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
};

export function StageChevronBadge({
  stage,
  className,
  stageText = true,
}: StageChevronBadgeProps) {
  if (!stage?.trim()) return null;

  const trimmed = stage.trim();
  const key = normalizeStageKey(trimmed);
  const segments = STAGE_CHEVRON_CONFIGS[key] ?? DEFAULT_SEGMENTS(trimmed);

  return (
    <div className={cn('flex h-[24px] items-stretch', className)}>
      {stageText && (
        <div
          className="relative z-50 flex items-center justify-center pr-4 text-[13px] font-medium tracking-wide text-gray-600"
          style={{ clipPath: FLAT_LEFT_CLIP }}
        >
          Stage
        </div>
      )}

      {segments.map((segment, index) => {
        const hasText = segment.label !== '';
        return (
          <div
            key={index}
            className="relative flex items-center justify-center text-[13px] font-medium tracking-wide text-white"
            style={{
              backgroundColor: segment.color,
              clipPath: CHEVRON_CLIP,
              marginLeft: '-10px',
              zIndex: segments.length - index,
              width: hasText ? undefined : '23px',
              paddingLeft: hasText ? '20px' : undefined,
              paddingRight: hasText ? '20px' : undefined,
            }}
          >
            {segment.label}
          </div>
        );
      })}
    </div>
  );
}
