import type {
  IdeaDocumentExtractDataDto,
  ProblemDocumentExtractDataDto,
} from './dto/extract-document.dto';
import { DocumentEntityType } from './dto/extract-document.dto';

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 5000;
const MAX_COST_BENEFIT_LENGTH = 13;
const MAX_TAGS = 10;

function trimTo(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .trim()
    .slice(0, maxLength);
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(tag => String(tag).trim())
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

export function normalizeIdeaDocumentExtractResponse(
  parsed: unknown,
): IdeaDocumentExtractDataDto {
  const source = parsed as Partial<IdeaDocumentExtractDataDto> | null;

  return {
    title: trimTo(source?.title, MAX_TITLE_LENGTH),
    description: trimTo(source?.description, MAX_TEXT_LENGTH),
    tags: normalizeTags(source?.tags),
  };
}

export function normalizeProblemDocumentExtractResponse(
  parsed: unknown,
): ProblemDocumentExtractDataDto {
  const source = parsed as Partial<ProblemDocumentExtractDataDto> | null;

  return {
    title: trimTo(source?.title, MAX_TITLE_LENGTH),
    description: trimTo(source?.description, MAX_TEXT_LENGTH),
    valueProposition: trimTo(source?.valueProposition, MAX_TEXT_LENGTH),
    costBenefit: trimTo(source?.costBenefit, MAX_COST_BENEFIT_LENGTH),
    tags: normalizeTags(source?.tags),
  };
}

export function normalizeDocumentExtractResponse(
  parsed: unknown,
  entityType: DocumentEntityType,
): IdeaDocumentExtractDataDto | ProblemDocumentExtractDataDto {
  return entityType === DocumentEntityType.IDEA
    ? normalizeIdeaDocumentExtractResponse(parsed)
    : normalizeProblemDocumentExtractResponse(parsed);
}
