import { Prisma } from '../../../generated/prisma/client';

type FormatTsQueryOptions = {
  minWordLength?: number;
  joinOperator?: '&' | '|';
  prefixMatch?: boolean;
};

export type SearchVectorColumn = 'i.search_vector' | 'p.search_vector';

const DEFAULT_FORMAT_OPTIONS: Required<FormatTsQueryOptions> = {
  minWordLength: 1,
  joinOperator: '&',
  prefixMatch: true,
};

export function buildSearchText(
  ...parts: Array<string | undefined | null>
): string {
  return parts
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

export function formatTsQuery(
  text: string,
  options: FormatTsQueryOptions = {},
): string | null {
  const resolvedOptions = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const tokens = text
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length >= resolvedOptions.minWordLength)
    .map(word => (resolvedOptions.prefixMatch ? `${word}:*` : word));

  return tokens.length > 0
    ? tokens.join(` ${resolvedOptions.joinOperator} `)
    : null;
}

export function tsQueryMatchSql(
  searchVectorColumn: SearchVectorColumn,
  formattedQuery: string,
): Prisma.Sql {
  return Prisma.sql`${Prisma.raw(searchVectorColumn)} @@ to_tsquery('english', ${formattedQuery})`;
}

export function tsRankSql(
  searchVectorColumn: SearchVectorColumn,
  formattedQuery: string,
): Prisma.Sql {
  return Prisma.sql`COALESCE(ts_rank(${Prisma.raw(searchVectorColumn)}, to_tsquery('english', ${formattedQuery})), 0)`;
}
