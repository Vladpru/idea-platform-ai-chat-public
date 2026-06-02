import { IdeaPrefillMode } from '../../idea/dto/generate-idea-prefill.dto';
import type { IdeaPrefillInput } from '../types/ai.types';

export function buildGeminiPrefillPrompt(input: IdeaPrefillInput): string {
  const modeInstruction =
    input.mode === IdeaPrefillMode.TITLE
      ? 'Strong title; short description.'
      : input.mode === IdeaPrefillMode.DESCRIPTION
        ? 'Full description; short title.'
        : 'Full draft: title and description.';

  return [
    'Product idea assistant. JSON only, no markdown:',
    '{"title":"","description":"","problemStatement":"","tags":[]}',
    modeInstruction,
    `Prompt: ${input.userPrompt}`,
    input.title ? `Title: ${input.title}` : '',
    input.description ? `Description: ${input.description}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
