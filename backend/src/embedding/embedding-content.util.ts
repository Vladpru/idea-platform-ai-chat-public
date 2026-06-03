import { createHash } from 'crypto';

function formatSortedTags(tagNames: string[]): string {
  return [...tagNames]
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(', ');
}

function hasNonEmptyFieldValues(content: string): boolean {
  return content.split('\n').some(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      return false;
    }
    return line.slice(colonIndex + 1).trim().length > 0;
  });
}

export function buildIdeaEmbeddingContent(input: {
  title?: string | null;
  description?: string | null;
  tagNames: string[];
}): string {
  const tags = formatSortedTags(input.tagNames);
  return `title: ${input.title ?? ''}\ndescription: ${input.description ?? ''}\ntags: ${tags}`;
}

export function buildProblemEmbeddingContent(input: {
  title?: string | null;
  description?: string | null;
  valueProposition?: string | null;
  category?: string | null;
  impact?: string | null;
  tagNames: string[];
}): string {
  const tags = formatSortedTags(input.tagNames);
  return `title: ${input.title ?? ''}\ndescription: ${input.description ?? ''}\nvalue_proposition: ${input.valueProposition ?? ''}\ncategory: ${input.category ?? ''}\nimpact: ${input.impact ?? ''}\ntags: ${tags}`;
}

export function hashEmbeddingContent(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed || !hasNonEmptyFieldValues(trimmed)) {
    return null;
  }
  return createHash('sha256').update(trimmed, 'utf8').digest('hex');
}
