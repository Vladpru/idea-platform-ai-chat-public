import {
  areIdeaEditFormValuesEqual,
  type IdeaEditFormValues,
  ideaEditSchema,
} from '@/features/ideas/lib/edit-idea';
import { IDEA_STAGES } from '@/features/ideas/lib/stages';
import { textareaClass } from '@/features/ideas/lib/styles';
import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/features/ideas/ui/create-idea/Fields';
import { IdeaEditAttachmentsField } from '@/features/ideas/ui/idea-form/IdeaEditAttachmentsField';
import { IdeaEditMainImageField } from '@/features/ideas/ui/idea-form/IdeaEditMainImageField';
import { SuggestedTagsField } from '@/features/tags/ui/SuggestedTagsField';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';

import { cn } from '@/shared/lib/utils';
import { selectClass } from '@/shared/ui/TagsInput';
import { Input } from '@/shared/ui/input';

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
        <div className="relative mt-2">
          <select
            id={`${formId}-stage`}
            className={cn(selectClass, 'pr-9')}
            aria-invalid={!!errors.stage}
            disabled={isSubmitting}
            {...register('stage')}
          >
            {IDEA_STAGES.map(stage => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="text-brand-gray-600 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            aria-hidden
          />
        </div>
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
        <textarea
          id={`${formId}-description`}
          className={cn(textareaClass, 'mt-2')}
          placeholder="Enter a description of the idea..."
          aria-invalid={!!errors.description}
          disabled={isSubmitting}
          {...register('description')}
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
