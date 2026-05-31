import type { ProblemStage } from '@/features/problems/api/problems-api.types';
import type {
  ProblemDashboardFilter,
  ProblemDashboardSort,
} from '../model/problems-dashboard.types';

export const PROBLEM_DASHBOARD_FILTERS: {
  id: ProblemDashboardFilter;
  label: string;
}[] = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'ARCHIVED', label: 'Archived' },
];

export const FILTER_TO_API_STAGE: Record<
  Exclude<ProblemDashboardFilter, 'ALL'>,
  ProblemStage
> = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const API_STAGE_TO_FILTER: Record<ProblemStage, ProblemDashboardFilter> =
  {
    active: 'ACTIVE',
    completed: 'COMPLETED',
    archived: 'ARCHIVED',
  };

export const DEFAULT_PROBLEMS_DASHBOARD_SEARCH = {
  sort: 'newest',
} as const;

export const PROBLEM_DASHBOARD_SORT_OPTIONS: {
  value: ProblemDashboardSort;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Old First' },
  { value: 'most-viewed', label: 'Most viewed' },
  { value: 'most-popular', label: 'Most Popular' },
  { value: 'most-ideas-linked', label: 'Most Ideas Linked' },
];
