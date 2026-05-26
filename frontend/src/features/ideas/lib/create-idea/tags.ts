export function parseTags(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map(tag => tag.trim()).filter(Boolean);
}

export function formatTags(tags: string[]): string {
  return tags.join(', ');
}
