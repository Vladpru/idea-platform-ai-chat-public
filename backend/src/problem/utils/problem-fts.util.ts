export function formatTsQuery(text: string): string | null {
  const formatted = text
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => `${word}:*`)
    .join(' & ');

  return formatted || null;
}

export function buildProblemSearchText(
  title?: string,
  description?: string,
): string {
  return [title?.trim(), description?.trim()].filter(Boolean).join(' ');
}
