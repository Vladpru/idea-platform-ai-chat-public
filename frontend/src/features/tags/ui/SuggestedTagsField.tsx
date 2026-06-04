import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/features/ideas/ui/create-idea/Fields';
import { useSuggestedTags } from '@/features/tags/hooks/use-suggested-tags';
import { getSelectedTagNames } from '@/features/tags/lib/tag-suggestions';
import { SuggestedTagsChips } from '@/features/tags/ui/SuggestedTagsChips';
import type { Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';

import { TagsInput } from '@/shared/ui/TagsInput';

type SuggestedTagsFieldProps<TFieldValues extends FieldValues> = {
  formId: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  tagsFieldName?: Path<TFieldValues>;
  titleFieldName?: Path<TFieldValues>;
  descriptionFieldName?: Path<TFieldValues>;
  disabled?: boolean;
  context?: 'idea' | 'problem';
};

export function SuggestedTagsField<TFieldValues extends FieldValues>({
  formId,
  control,
  errors,
  tagsFieldName = 'tags' as Path<TFieldValues>,
  titleFieldName = 'title' as Path<TFieldValues>,
  descriptionFieldName = 'description' as Path<TFieldValues>,
  disabled = false,
  context = 'problem',
}: SuggestedTagsFieldProps<TFieldValues>) {
  const title = useWatch({ control, name: titleFieldName }) as string | undefined;
  const description = useWatch({
    control,
    name: descriptionFieldName,
  }) as string | undefined;
  const tagsValue = useWatch({ control, name: tagsFieldName }) as
    | string
    | undefined;
  const excludeNames = getSelectedTagNames(tagsValue);

  const { suggestedTags, hasSearchInput, isSuggestionsLoading } =
    useSuggestedTags({
      title,
      description,
      excludeNames,
      context,
    });

  const tagsError = errors[tagsFieldName]?.message as string | undefined;

  return (
    <Controller
      name={tagsFieldName}
      control={control}
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel htmlFor={`${formId}-tags`}>Tags</FieldLabel>
          <TagsInput
            id={`${formId}-tags`}
            value={(field.value as string | undefined) ?? ''}
            onChange={field.onChange}
            disabled={disabled}
            aria-invalid={!!tagsError}
          />
          <SuggestedTagsChips
            tags={suggestedTags}
            tagsValue={(field.value as string | undefined) ?? ''}
            onTagsChange={field.onChange}
            isLoading={isSuggestionsLoading}
            hasSearchInput={hasSearchInput}
          />
          <FieldError message={tagsError} />
        </FieldGroup>
      )}
    />
  );
}
