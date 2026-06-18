export function normalizeTagName(raw: string): string | null {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!normalized || normalized.length > 100) {
    return null;
  }

  return normalized;
}

export function toTagDisplayLabel(name: string, catalogLabel?: string | null): string {
  const trimmed = catalogLabel?.trim();
  if (trimmed) {
    return trimmed;
  }

  return name
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeSqlScore(
  value: number | bigint | string,
  maxExpected = 10,
): number {
  const numeric = typeof value === 'bigint' ? Number(value) : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.min(3, (numeric / maxExpected) * 3);
}

export function normalizeCosineScore(similarity: number): number {
  if (!Number.isFinite(similarity) || similarity <= 0) {
    return 0;
  }

  return Math.min(3, similarity * 3);
}
