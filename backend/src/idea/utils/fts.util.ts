export function convertToSearchQuery(text: string): string {
  const words = text
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"’]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 2);

  if (words.length === 0) return '';

  return words.map(word => `${word}:*`).join(' | ');
}
