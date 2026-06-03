import type { GenerateImageInput } from '../../ai/types/generate-image.types';

export function buildDeapiImagePrompt(input: GenerateImageInput): string {
  const contextLines: string[] = [];
  if (input.title) {
    contextLines.push(`Idea title: ${input.title}`);
  }
  if (input.description) {
    contextLines.push(`Idea description: ${input.description}`);
  }

  const contextBlock = contextLines.length
    ? `Context:\n${contextLines.join('\n')}\n\n`
    : '';

  const parts: string[] = [
    'Polished cover image for a product idea platform.',
    'No text overlays, watermarks, or logos.',
  ];

  if (contextBlock) {
    parts.push(contextBlock);
  }

  parts.push(`Creative direction: ${input.prompt.trim()}`);

  return parts.join('\n');
}
