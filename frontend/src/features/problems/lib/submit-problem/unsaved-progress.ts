import type { SubmitProblemFormValues } from './schema';
import { submitProblemDefaultValues } from './schema';

export function hasSubmitProblemUnsavedProgress(
  formIsDirty: boolean,
  values: SubmitProblemFormValues,
): boolean {
  if (formIsDirty) {
    return true;
  }

  if (values.title.trim() || values.description.trim()) {
    return true;
  }

  if (values.valueProposition?.trim()) {
    return true;
  }

  if (values.costBenefit?.trim()) {
    return true;
  }

  if (values.ideaIds?.trim()) {
    return true;
  }

  if (values.tags?.trim()) {
    return true;
  }

  if (values.files && values.files.length > 0) {
    return true;
  }

  if (values.stage !== submitProblemDefaultValues.stage) {
    return true;
  }

  return false;
}
