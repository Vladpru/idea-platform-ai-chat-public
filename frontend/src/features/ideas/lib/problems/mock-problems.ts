export type MockProblem = {
  id: string;
  label: string;
};

export const MOCK_PROBLEMS: MockProblem[] = [
  {
    id: 'material-delays',
    label: 'Delays due to material supply shortages',
  },
  {
    id: 'equipment-visibility',
    label: 'Low visibility into equipment usage',
  },
  {
    id: 'material-consumption',
    label: 'Inadequate tracking of material consumption',
  },
  {
    id: 'equipment-utilization',
    label: 'Limited insight into equipment utilization',
  },
  {
    id: 'contractor-communication',
    label: 'Poor communication between contractors and clients',
  },
  {
    id: 'progress-tracking',
    label: 'Lack of real-time progress tracking',
  },
];

export function parseProblemIds(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

export function formatProblemIds(ids: string[]): string {
  return ids.join(',');
}

export function getProblemLabel(id: string): string | undefined {
  return MOCK_PROBLEMS.find(problem => problem.id === id)?.label;
}
