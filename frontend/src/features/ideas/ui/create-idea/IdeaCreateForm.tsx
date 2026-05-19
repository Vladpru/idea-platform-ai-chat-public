import { useIdeaCreateForm } from '@/features/ideas/hooks/use-idea-create-form';
import { IDEA_STAGES } from '@/features/ideas/lib/stages';
import {
  outlineBtnClass,
  publishBtnClass,
  selectClass,
  textareaClass,
} from '@/features/ideas/lib/styles';
import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, Upload } from 'lucide-react';
import { useId, useRef } from 'react';
import { Controller } from 'react-hook-form';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { FieldError, FieldGroup, FieldLabel } from './Fields';
import ProblemSelect from './ProblemSelect';
import { TagsInput } from './TagsInput';

function AiAssistLink({
  children,
  onClick,
}: {
  children: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-brand-dark-blue dark:text-brand-light-blue inline-flex items-center gap-1 text-xs font-semibold tracking-wide transition-colors"
    >
      <SparklesIcon className="group-hover:text-brand-dark-blue/80 dark:group-hover:text-brand-light-blue/80 size-5 transition-colors" />
      <span className="group-hover:text-brand-dark-blue/80 dark:group-hover:text-brand-light-blue/80 transition-colors">
        {children}
      </span>
    </button>
  );
}

export function IdeaCreateForm() {
  const navigate = useNavigate();
  const formId = useId();
  const filesInputRef = useRef<HTMLInputElement>(null);

  const {
    form,
    imageInputRef,
    displayImageUrl,
    isDraggingImage,
    setIsDraggingImage,
    setMainImage,
    onSaveDraft,
    onPublish,
    canPublish,
    isBusy,
    isHydrating,
    error,
    resetCreateIdea,
  } = useIdeaCreateForm();

  const {
    register,
    control,
    formState: { errors },
  } = form;

  const handleCancel = () => {
    resetCreateIdea();
    void navigate({ to: ROUTES.ideas });
  };

  return (
    <form id={formId} className="space-y-8" onSubmit={onPublish} noValidate>
      {error ? (
        <p
          role="alert"
          className="text-destructive rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}

      {isHydrating ? (
        <p className="text-brand-gray-600 text-sm">Loading draft...</p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor={`${formId}-stage`} required>
            Stage
          </FieldLabel>
          <div className="relative mt-2">
            <select
              id={`${formId}-stage`}
              className={cn(selectClass, 'pr-9')}
              aria-invalid={!!errors.stage}
              disabled={isBusy}
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

        <ProblemSelect formId={formId} control={control} errors={errors} />
      </div>

      <FieldGroup>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <FieldLabel htmlFor={`${formId}-title`} required>
            Title
          </FieldLabel>
          <AiAssistLink>Re-Generate title from description</AiAssistLink>
        </div>
        <Input
          id={`${formId}-title`}
          className="mt-2 bg-white"
          placeholder="Type in the name of the idea..."
          aria-invalid={!!errors.title}
          disabled={isBusy}
          {...register('title')}
        />
        <FieldError message={errors.title?.message} />
      </FieldGroup>

      <FieldGroup>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <FieldLabel htmlFor={`${formId}-description`} required>
            Description
          </FieldLabel>
          <AiAssistLink>Write description with AI prompt</AiAssistLink>
        </div>
        <textarea
          id={`${formId}-description`}
          className={cn(textareaClass, 'mt-2')}
          placeholder="Enter a description of the idea..."
          aria-invalid={!!errors.description}
          disabled={isBusy}
          {...register('description')}
        />
        <FieldError message={errors.description?.message} />
      </FieldGroup>

      <FieldGroup>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <FieldLabel required hint="This will be the main image for your idea">
            Main image
          </FieldLabel>
          <AiAssistLink>
            Generate image from title &amp; description
          </AiAssistLink>
        </div>
        <Controller
          name="mainImage"
          control={control}
          render={() => (
            <>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={event => {
                  const file = event.target.files?.[0] ?? null;
                  setMainImage(file);
                }}
              />
              <div
                role="button"
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    imageInputRef.current?.click();
                  }
                }}
                onClick={() => imageInputRef.current?.click()}
                onDragOver={event => {
                  event.preventDefault();
                  setIsDraggingImage(true);
                }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={event => {
                  event.preventDefault();
                  setIsDraggingImage(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file?.type.startsWith('image/')) {
                    setMainImage(file);
                  }
                }}
                className={cn(
                  'border-brand-gray-200 hover:border-brand-dark-blue/40 focus-visible:ring-ring mt-2 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-white px-4 py-10 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isDraggingImage && 'border-brand-dark-blue bg-brand-gray-100',
                  errors.mainImage && 'border-destructive',
                )}
              >
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt="Selected idea preview"
                    className="max-h-48 max-w-full rounded object-contain"
                  />
                ) : (
                  <>
                    <Upload
                      className="text-brand-gray-400 mb-3 size-10"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <p className="text-brand-gray-700 text-sm font-medium">
                      Generate or Choose or Drag and Drop an Image
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        />
        <FieldError message={errors.mainImage?.message} />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor={`${formId}-tags`}>Tags</FieldLabel>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagsInput
              id={`${formId}-tags`}
              value={field.value ?? ''}
              onChange={field.onChange}
              disabled={isBusy}
              aria-invalid={!!errors.tags}
            />
          )}
        />
        <FieldError message={errors.tags?.message} />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Files</FieldLabel>
        <Controller
          name="files"
          control={control}
          render={({ field }) => (
            <>
              <input
                ref={filesInputRef}
                type="file"
                multiple
                className="sr-only"
                onChange={event => {
                  const list = event.target.files;
                  field.onChange(list ? Array.from(list) : []);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-brand-gray-200 text-brand-dark-blue mt-2 size-11 rounded-md"
                aria-label="Upload files"
                onClick={() => filesInputRef.current?.click()}
              >
                <Upload className="size-5" aria-hidden />
              </Button>
            </>
          )}
        />
      </FieldGroup>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isBusy}
          className="text-brand-accent hover:text-brand-accent/80 px-2 text-sm font-bold tracking-wide uppercase transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <Button
          type="button"
          variant="outline"
          className={outlineBtnClass}
          onClick={onSaveDraft}
          disabled={isBusy}
          isLoading={isBusy}
        >
          Save as draft
        </Button>
        <Button
          type="submit"
          className={publishBtnClass}
          disabled={!canPublish || isBusy}
        >
          Publish idea
        </Button>
      </div>
    </form>
  );
}
