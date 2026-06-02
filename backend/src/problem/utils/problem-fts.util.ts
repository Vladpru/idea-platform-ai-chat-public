import {
  buildSearchText,
  formatTsQuery as formatSharedTsQuery,
} from '../../shared/utils/fts.util';

export function formatTsQuery(text: string): string | null {
  return formatSharedTsQuery(text, {
    minWordLength: 1,
    joinOperator: '&',
    prefixMatch: true,
  });
}

export function buildProblemSearchText(
  title?: string,
  description?: string,
): string {
  return buildSearchText(title, description);
}
