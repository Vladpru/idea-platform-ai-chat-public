import type { EntitySummaryContent } from '../../ai-summary/summary.types';

function formatField(label: string, value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }
  return `${label}: ${trimmed}`;
}

export function buildEntitySummaryPrompt(
  content: EntitySummaryContent,
): string {
  const isIdea = content.entityType === 'idea';
  const entityLabel = isIdea ? 'idea' : 'problem';

  const fields = isIdea
    ? [
        formatField('Title', content.title),
        formatField('Description', content.description),
      ]
    : [
        formatField('Title', content.title),
        formatField('Description', content.description),
        formatField('Value proposition', content.valueProposition),
        formatField('Category', content.category),
        formatField('Impact', content.impact),
      ];

  const body = fields.filter(Boolean).join('\n');

  if (!body.trim()) {
    throw new Error(
      `Cannot build prompt: no content for ${content.entityType}`,
    );
  }

  const focusInstruction = isIdea
    ? 'Focus on the core idea, solution, and potential value.'
    : 'Focus on the core problem, its impact, and the value proposition.';

  return [
    `You are summarizing a ${entityLabel} for a product innovation platform.`,
    'Write a concise plain-text summary in 2-4 sentences.',
    focusInstruction,
    'Do not use markdown, bullet points, headings, or JSON.',
    'Return only the summary text.',
    '',
    '<entity_data>',
    body,
    '</entity_data>',
  ].join('\n');
}
