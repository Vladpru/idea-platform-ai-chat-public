import {
  areIdeaEditFormValuesEqual,
  type IdeaEditFormValues,
  ideaEditSchema,
} from '@/features/ideas/lib/edit-idea';
import { IDEA_STAGES } from '@/features/ideas/lib/stages';
import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/features/ideas/ui/create-idea/Fields';
import { IdeaEditAttachmentsField } from '@/features/ideas/ui/idea-form/IdeaEditAttachmentsField';
import { IdeaEditMainImageField } from '@/features/ideas/ui/idea-form/IdeaEditMainImageField';
import { SuggestedTagsField } from '@/features/tags/ui/SuggestedTagsField';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';
import { RichTextEditor } from '@/shared/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

export type IdeaFormInitialData = IdeaEditFormValues;

type IdeaFormProps = {
  initialData: IdeaFormInitialData;
  onSubmit: (values: IdeaEditFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  isSubmitting?: boolean;
  formId?: string;
};

export function IdeaForm({
  initialData,
  onSubmit,
  onDirtyChange,
  isSubmitting = false,
  formId: formIdProp,
}: IdeaFormProps) {
  const generatedId = useId();
  const formId = formIdProp ?? generatedId;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    getValues,
    watch,
  } = useForm<IdeaEditFormValues>({
    resolver: zodResolver(ideaEditSchema),
    values: initialData,
  });

  useEffect(() => {
    if (!onDirtyChange) {
      return;
    }

    const syncDirty = () => {
      onDirtyChange(!areIdeaEditFormValuesEqual(getValues(), initialData));
    };

    syncDirty();
    const subscription = watch(() => syncDirty());
    return () => subscription.unsubscribe();
  }, [watch, getValues, initialData, onDirtyChange]);

  return (
    <form
      id={formId}
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FieldGroup>
        <FieldLabel htmlFor={`${formId}-stage`} required>
          Stage
        </FieldLabel>
        <Controller
          control={control}
          name="stage"
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onValueChange={field.onChange}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id={`${formId}-stage`}
                className={cn('bg-card mt-2 w-full', errors.stage && 'border-destructive')}
              >
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {IDEA_STAGES.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.stage?.message} />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor={`${formId}-title`} required>
          Title
        </FieldLabel>
        <Input
          id={`${formId}-title`}
          className="bg-card mt-2"
          placeholder="Type in the name of the idea..."
          aria-invalid={!!errors.title}
          disabled={isSubmitting}
          {...register('title')}
        />
        <FieldError message={errors.title?.message} />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor={`${formId}-description`} required>
          Description
        </FieldLabel>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              id={`${formId}-description`}
              value={field.value ?? ''}
              onChange={field.onChange}
              disabled={isSubmitting}
              aria-invalid={!!errors.description}
            />
          )}
        />
        <FieldError message={errors.description?.message} />
      </FieldGroup>

      <FieldGroup>
        <IdeaEditMainImageField
          control={control}
          setValue={setValue}
          setError={setError}
          clearErrors={clearErrors}
          errorMessage={errors.mainImage?.message}
          disabled={isSubmitting}
          formId={formId}
        />
      </FieldGroup>

      <SuggestedTagsField
        formId={formId}
        control={control}
        errors={errors}
        disabled={isSubmitting}
        context="idea"
      />

      <FieldGroup>
        <FieldLabel>Files</FieldLabel>
        <IdeaEditAttachmentsField control={control} disabled={isSubmitting} />
        <FieldError message={errors.newFiles?.message} />
      </FieldGroup>
    </form>
  );
}
