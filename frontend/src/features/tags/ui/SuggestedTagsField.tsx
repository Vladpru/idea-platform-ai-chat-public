import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/features/ideas/ui/create-idea/Fields';
import type { Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';

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
  disabled = false,
}: SuggestedTagsFieldProps<TFieldValues>) {
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
          <FieldError message={tagsError} />
        </FieldGroup>
      )}
    />
  );
}
