import type { ZodIssue } from 'zod';

import type { IdeaCreateFormValues } from './schema';

export const IDEA_CREATE_PUBLISH_FIELD_ORDER: (keyof IdeaCreateFormValues)[] = [
  'problemId',
  'title',
  'description',
  'mainImage',
  'stage',
  'tags',
  'files',
];

export function getFirstPublishErrorField(
  issues: ZodIssue[],
): keyof IdeaCreateFormValues | undefined {
  const invalidFields = new Set(
    issues
      .map(issue => issue.path[0])
      .filter(
        (segment): segment is keyof IdeaCreateFormValues =>
          typeof segment === 'string' &&
          IDEA_CREATE_PUBLISH_FIELD_ORDER.includes(
            segment as keyof IdeaCreateFormValues,
          ),
      ),
  );

  return IDEA_CREATE_PUBLISH_FIELD_ORDER.find(field => invalidFields.has(field));
}

export type PublishFieldFocusTarget = {
  focusAndOpen?: () => void;
};

export function focusPublishField(
  field: keyof IdeaCreateFormValues,
  targets?: { problemId?: PublishFieldFocusTarget | null },
): void {
  if (field === 'problemId') {
    targets?.problemId?.focusAndOpen?.();
    return;
  }

  const container = document.querySelector(
    `[data-publish-field="${field}"]`,
  ) as HTMLElement | null;
  if (!container) return;

  container.scrollIntoView({ behavior: 'smooth', block: 'center' });

  requestAnimationFrame(() => {
    const focusable = container.querySelector<HTMLElement>(
      'input:not([type="hidden"]), textarea, select, [role="combobox"]',
    );
    focusable?.focus({ preventScroll: true });
  });
}
