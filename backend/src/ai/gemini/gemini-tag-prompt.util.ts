import type { SuggestTagsInput } from '../types/ai.types';

export function buildGeminiTagPrompt(input: SuggestTagsInput): string {
  const knownTags =
    input.knownTags && input.knownTags.length > 0
      ? input.knownTags.slice(0, 100).join(', ')
      : '';

  return [
    'Tag suggestion assistant. Return JSON only, no markdown:',
    '{"tags":["supplier","delay"]}',
    'Rules:',
    '- Suggest 3 to 6 short lowercase tags relevant to the content',
    '- Use hyphenated single concepts when needed (e.g. supply-chain)',
    '- Prefer tags from the known catalog when they fit',
    '- No sentences, no hashtags, no duplicates',
    knownTags ? `Known catalog tags: ${knownTags}` : '',
    input.title ? `Title: ${input.title}` : '',
    `Description: ${input.description}`,
  ]
    .filter(Boolean)
    .join('\n');
}
