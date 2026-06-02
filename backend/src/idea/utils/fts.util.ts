import { formatTsQuery } from '../../shared/utils/fts.util';

export function convertToSearchQuery(text: string): string {
  return (
    formatTsQuery(text, {
      minWordLength: 3,
      joinOperator: '|',
      prefixMatch: true,
    }) ?? ''
  );
}
