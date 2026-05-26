export function parseIdeaIds(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

export function formatIdeaIds(ids: string[]): string {
  return ids.join(',');
}
