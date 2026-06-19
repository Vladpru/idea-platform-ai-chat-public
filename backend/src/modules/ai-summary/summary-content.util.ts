import type {
  EntitySummaryContent,
  IdeaSubstantialExisting,
  IdeaSubstantialUpdate,
  ProblemSubstantialExisting,
  ProblemSubstantialUpdate,
  SummaryEntityType,
} from './summary.types';

export const MIN_SUMMARY_TITLE_LENGTH = 3;
export const MIN_SUMMARY_DESC_LENGTH = 8;

function normalizeComparableString(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return value.trim();
}

function fieldChanged(
  existing: string | null | undefined,
  incoming: string | undefined,
): boolean {
  if (incoming === undefined) {
    return false;
  }
  return (
    normalizeComparableString(existing) !== normalizeComparableString(incoming)
  );
}

export function hasSubstantialContentChanges(
  entityType: 'idea',
  existing: IdeaSubstantialExisting,
  dto: IdeaSubstantialUpdate,
): boolean;
export function hasSubstantialContentChanges(
  entityType: 'problem',
  existing: ProblemSubstantialExisting,
  dto: ProblemSubstantialUpdate,
): boolean;
export function hasSubstantialContentChanges(
  entityType: SummaryEntityType,
  existing: IdeaSubstantialExisting | ProblemSubstantialExisting,
  dto: IdeaSubstantialUpdate | ProblemSubstantialUpdate,
): boolean {
  if (entityType === 'idea') {
    return (
      fieldChanged(existing.title, dto.title) ||
      fieldChanged(existing.description, dto.description)
    );
  }

  const problemExisting = existing as ProblemSubstantialExisting;
  const problemDto = dto as ProblemSubstantialUpdate;

  return (
    fieldChanged(problemExisting.title, problemDto.title) ||
    fieldChanged(problemExisting.description, problemDto.description) ||
    fieldChanged(
      problemExisting.valueProposition,
      problemDto.valueProposition,
    ) ||
    fieldChanged(problemExisting.category, problemDto.category) ||
    fieldChanged(problemExisting.impact, problemDto.impact)
  );
}

export function hasSummarizableContent(content: EntitySummaryContent): boolean {
  const titleLen = normalizeComparableString(content.title).length;
  const descLen = normalizeComparableString(content.description).length;

  if (
    titleLen >= MIN_SUMMARY_TITLE_LENGTH ||
    descLen >= MIN_SUMMARY_DESC_LENGTH
  ) {
    return true;
  }

  if (content.entityType === 'problem') {
    const extraFields = [
      content.valueProposition,
      content.category,
      content.impact,
    ];
    return extraFields.some(
      field => normalizeComparableString(field).length > 0,
    );
  }

  return false;
}
