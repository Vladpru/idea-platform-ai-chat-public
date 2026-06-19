import { DocumentEntityType } from './dto/extract-document.dto';

export function buildDocumentExtractPrompt(
  documentText: string,
  entityType: DocumentEntityType,
): string {
  const isIdea = entityType === DocumentEntityType.IDEA;
  const schema = isIdea
    ? '{"title":"","description":"","tags":[]}'
    : '{"title":"","description":"","valueProposition":"","costBenefit":"","tags":[]}';

  const fieldHints = isIdea
    ? 'title, description, tags'
    : 'title, description, valueProposition, costBenefit, tags';

  return [
    'Document extraction assistant. JSON only, no markdown.',
    `Schema: ${schema}`,
    `Extract ${fieldHints} from the document below.`,
    'Rules:',
    '- Use only content explicitly present in the document.',
    '- If a section is missing, return an empty string or empty array.',
    '- Do not invent, infer, or expand content.',
    '- Keep title under 200 characters.',
    '- Keep description and valueProposition under 5000 characters.',
    '- Keep costBenefit under 13 characters (monetary amount only, no currency symbols).',
    '- Tags: up to 10 short labels found in or clearly labeled in the document.',
    'Document:',
    documentText,
  ].join('\n');
}
