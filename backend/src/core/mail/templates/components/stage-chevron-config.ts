export type StageChevronSegment = {
  color: string;
  label: string;
};

function normalizeStageKey(stage: string | null | undefined): string {
  if (stage == null || typeof stage !== 'string') {
    return '';
  }
  return stage.trim().toUpperCase().replace(/\s+/g, '_');
}

const STAGE_CHEVRON_CONFIGS: Record<string, StageChevronSegment[]> = {
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
    { color: '#FFA900', label: '' },
    { color: '#2B787C', label: '' },
    { color: '#8E3F8A', label: 'Archived' },
  ],
};

const DEFAULT_SEGMENTS = (label: string): StageChevronSegment[] => [
  { color: '#9CA3AF', label },
  { color: '#D1D5DB', label: '' },
  { color: '#E5E7EB', label: '' },
];

export function getStageChevronSegments(
  stage: string | null | undefined,
): StageChevronSegment[] | null {
  if (!stage?.trim()) {
    return null;
  }

  const trimmed = stage.trim();
  const key = normalizeStageKey(trimmed);
  return STAGE_CHEVRON_CONFIGS[key] ?? DEFAULT_SEGMENTS(trimmed);
}
