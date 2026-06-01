import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/features/ideas/ui/create-idea/Fields';
import { useTagSuggestions } from '@/features/problems/hooks/use-tag-suggestions';
import type { SubmitProblemFormValues } from '@/features/problems/lib/submit-problem';
import { getSelectedTagNames } from '@/features/problems/lib/submit-problem/suggested-tags';
import { SuggestedTagsChips } from '@/features/problems/ui/submit-problem/SuggestedTagsChips';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';

import { TagsInput } from '@/shared/ui/TagsInput';

type ProblemTagsFieldProps = {
  formId: string;
  control: Control<SubmitProblemFormValues>;
  errors: FieldErrors<SubmitProblemFormValues>;
  disabled?: boolean;
};

export function ProblemTagsField({
  formId,
  control,
  errors,
  disabled = false,
}: ProblemTagsFieldProps) {
  const title = useWatch({ control, name: 'title' });
  const description = useWatch({ control, name: 'description' });
  const tagsValue = useWatch({ control, name: 'tags' });
  const excludeNames = getSelectedTagNames(tagsValue);

  const { suggestedTags, isSuggestionsLoading } = useTagSuggestions({
    title,
    description,
    excludeNames,
  });

  return (
    <Controller
      name="tags"
      control={control}
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel htmlFor={`${formId}-tags`}>Tags</FieldLabel>
          <TagsInput
            id={`${formId}-tags`}
            value={field.value ?? ''}
            onChange={field.onChange}
            disabled={disabled}
            aria-invalid={!!errors.tags}
          />
          <SuggestedTagsChips
            tags={suggestedTags}
            tagsValue={field.value ?? ''}
            onTagsChange={field.onChange}
            isLoading={isSuggestionsLoading}
          />
          <FieldError message={errors.tags?.message} />
        </FieldGroup>
      )}
    />
  );
}
