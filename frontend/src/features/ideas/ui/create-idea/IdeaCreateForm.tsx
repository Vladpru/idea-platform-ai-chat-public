import { useIdeaCreateForm } from '@/features/ideas/hooks/use-idea-create-form';
import { hasCreateIdeaUnsavedProgress } from '@/features/ideas/lib/create-idea/unsaved-progress';
import { IDEA_STAGES } from '@/features/ideas/lib/stages';
import { useCreateIdeaStore } from '@/features/ideas/store/create-idea.store';
import {
  outlineBtnClass,
  publishBtnClass,
  selectClass,
  textareaClass,
} from '@/features/ideas/lib/styles';
import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, Upload } from 'lucide-react';
import { useId } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller } from 'react-hook-form';

import { ROUTES } from '@/shared/config/paths';
import { useCreateFormLeaveGuard } from '@/shared/hooks/use-create-form-leave-guard';
import { SAVE_IDEA_PROGRESS_DESCRIPTION } from '@/shared/lib/create-form-leave/copy';
import { cn } from '@/shared/lib/utils';
import { SaveProgressBeforeLeavingModal } from '@/shared/ui/save-progress-before-leaving-modal';
import { TagsInput } from '@/shared/ui/TagsInput';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import DeleteImageButton from './DeleteImageButton';
import { FieldError, FieldGroup, FieldLabel } from './Fields';
import { IdeaFilesField } from './IdeaFilesField';
import ProblemSelect from './ProblemSelect';

const ALLOWED_MAIN_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const INVALID_MAIN_IMAGE_TYPE_MESSAGE = 'Main image must be PNG, JPEG, or WEBP';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const FILE_TOO_LARGE_MESSAGE = 'File size must be less than 5MB';

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

  const {
    form,
    createdProblems,
    onProblemDraftCreated,
    displayImageUrl,
    setMainImage,
    clearMainImage,
    onSaveDraft,
    onPublish,
    isPublishedIdea,
    isBusy,
    isSavingDraft,
    isPublishing,
    isHydrating,
    error,
    clearCreateIdeaSession,
  } = useIdeaCreateForm();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty: formIsDirty },
  } = form;

  const titleValue = watch('title') || '';
  const descriptionValue = watch('description') || '';

  const hasUnsavedProgress = useCreateIdeaStore(
    state => hasCreateIdeaUnsavedProgress(state) || formIsDirty,
  );

  const {
    leaveModalOpen,
    requestLeave,
    allowNextLeave,
    handleLeaveModalOpenChange,
    handleDiscard,
    handleSaveAsDraft: handleLeaveSaveAsDraft,
  } = useCreateFormLeaveGuard({
    hasUnsavedProgress,
    isBusy,
    onSaveDraft,
    onDiscard: clearCreateIdeaSession,
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/png': [],
      'image/jpeg': [],
      'image/webp': [],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: isBusy,
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (!ALLOWED_MAIN_IMAGE_TYPES.includes(file.type)) {
        form.setError('mainImage', {
          type: 'manual',
          message: INVALID_MAIN_IMAGE_TYPE_MESSAGE,
        });
        return;
      }
      form.clearErrors('mainImage');
      setMainImage(file);
    },
    onDropRejected: fileRejections => {
      const tooLarge = fileRejections.some(rejection =>
        rejection.errors.some(error => error.code === 'file-too-large'),
      );
      form.setError('mainImage', {
        type: 'manual',
        message: tooLarge ? FILE_TOO_LARGE_MESSAGE : INVALID_MAIN_IMAGE_TYPE_MESSAGE,
      });
    },
  });

  const handleCancel = () => {
    requestLeave(() => {
      void navigate({ to: ROUTES.ideas, search: { sort: 'newest' } });
    });
  };

  const handleSaveDraft = async () => {
    const isSaved = await onSaveDraft();
    if (!isSaved) return;
    allowNextLeave(() => {
      void navigate({ to: ROUTES.ideas, search: { sort: 'newest' } });
    });
  };

  const handlePublish = async () => {
    const isPublished = await onPublish();
    if (!isPublished) return;
    allowNextLeave(() => {
      void navigate({ to: ROUTES.ideas, search: { sort: 'newest' } });
    });
  };

  return (
    <>
      <form
        id={formId}
        className="space-y-8"
        onSubmit={e => void handleSubmit(handlePublish)(e)}
        noValidate
      >
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

          <ProblemSelect
            formId={formId}
            control={control}
            errors={errors}
            createdProblems={createdProblems}
            onProblemDraftCreated={onProblemDraftCreated}
          />
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
            maxLength={200}
            {...register('title')}
          />
          <div className="flex items-start justify-between gap-4 pt-1">
            <FieldError message={errors.title?.message} />
            <span className="text-brand-gray-500 ml-auto text-xs">
              {titleValue.length}/200
            </span>
          </div>
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
            maxLength={5000}
            {...register('description')}
          />
          <div className="flex items-start justify-between gap-4 pt-1">
            <FieldError message={errors.description?.message} />
            <span className="text-brand-gray-500 ml-auto text-xs">
              {descriptionValue.length}/5000
            </span>
          </div>
        </FieldGroup>

        <FieldGroup>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <FieldLabel
              required
              hint="This will be the main image for your idea"
            >
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
              <div className="flex flex-col">
                <div
                  {...getRootProps()}
                  className={cn(
                    'border-brand-gray-200 hover:border-brand-dark-blue/40 focus-visible:ring-ring mt-2 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-white px-4 py-4 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    isDragActive && 'border-brand-dark-blue bg-brand-gray-100',
                    errors.mainImage && 'border-destructive',
                    isBusy && 'cursor-not-allowed opacity-50',
                    displayImageUrl && 'relative overflow-hidden p-0',
                  )}
                >
                  <input {...getInputProps()} />
                  {displayImageUrl ? (
                    <>
                      <img
                        src={displayImageUrl}
                        alt="Selected idea preview"
                        className="max-h-80 w-full rounded object-contain p-2"
                      />
                      <DeleteImageButton
                        onClick={(
                          event: React.MouseEvent<
                            HTMLButtonElement,
                            MouseEvent
                          >,
                        ) => {
                          event.stopPropagation();
                          clearMainImage();
                        }}
                        isBusy={isBusy}
                      />
                    </>
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
              </div>
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
          <IdeaFilesField control={control} disabled={isBusy} />
          <FieldError message={errors.files?.message} />
        </FieldGroup>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isBusy}
            className="text-brand-orange hover:text-brand-orange-hover px-2 text-sm font-bold tracking-wide uppercase transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {!isPublishedIdea ? (
            <Button
              type="button"
              variant="outline"
              className={outlineBtnClass}
              onClick={() => void handleSaveDraft()}
              disabled={isBusy}
              isLoading={isSavingDraft}
            >
              Save as draft
            </Button>
          ) : null}
          <Button
            type="submit"
            className={publishBtnClass}
            disabled={isBusy}
            isLoading={isPublishing}
          >
            {isPublishedIdea ? 'Save changes' : 'Publish idea'}
          </Button>
        </div>
      </form>

      <SaveProgressBeforeLeavingModal
        open={leaveModalOpen}
        onOpenChange={handleLeaveModalOpenChange}
        onDiscard={handleDiscard}
        onSaveAsDraft={() => void handleLeaveSaveAsDraft()}
        isSaving={isSavingDraft}
        description={SAVE_IDEA_PROGRESS_DESCRIPTION}
      />
    </>
  );
}
