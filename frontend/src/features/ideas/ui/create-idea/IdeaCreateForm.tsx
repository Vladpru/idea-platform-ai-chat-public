import type { IdeaAIPrefillResponse } from '@/features/ideas/api/ideas-api.types';
import { useIdeaCreateAiAssist } from '@/features/ideas/hooks/use-idea-create-ai-assist';
import { useIdeaCreateForm } from '@/features/ideas/hooks/use-idea-create-form';
import { focusPublishField } from '@/features/ideas/lib/create-idea';
import { IDEA_STAGES } from '@/features/ideas/lib/stages';
import {
  outlineBtnClass,
  publishBtnClass,
  selectClass,
} from '@/features/ideas/lib/styles';
import { SuggestedTagsField } from '@/features/tags/ui/SuggestedTagsField';
import { useNavigate } from '@tanstack/react-router';
import { usePostHog } from '@posthog/react';
import { Upload } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller } from 'react-hook-form';

import { ROUTES } from '@/shared/config/paths';
import { useCreateFormLeaveGuard } from '@/shared/hooks/use-create-form-leave-guard';
import { useDocumentAutoFill } from '@/shared/hooks/use-document-auto-fill';
import {
  SAVE_IDEA_PROGRESS_DESCRIPTION,
  UNDO_CHANGES_DESCRIPTION,
  UNDO_CHANGES_TITLE,
} from '@/shared/lib/create-form-leave/copy';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import { Input } from '@/shared/ui/input';
import { RichTextEditor } from '@/shared/ui/rich-text-editor';
import { SaveProgressBeforeLeavingModal } from '@/shared/ui/save-progress-before-leaving-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

import { AiGenerationModal } from '../modals/AiGenerationModal';
import DeleteImageButton from './DeleteImageButton';
import { FieldError, FieldGroup, FieldLabel } from './Fields';
import { IdeaCreateAiAssistLink } from './IdeaCreateAiAssistLink';
import { IdeaFilesField } from './IdeaFilesField';
import ProblemSelect, { type ProblemSelectHandle } from './ProblemSelect';
import { useMediaQuery } from '@/shared/hooks/use-media-query';

const ALLOWED_MAIN_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const INVALID_MAIN_IMAGE_TYPE_MESSAGE = 'Main image must be PNG, JPEG, or WEBP';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const FILE_TOO_LARGE_MESSAGE = 'File size must be less than 5MB';

export type IdeaDocumentAutoFillControls = {
  isScanning: boolean;
  handleFileSelected: (file: File) => void;
  disabled: boolean;
};

type IdeaCreateFormProps = {
  aiDraftPrefill?: IdeaAIPrefillResponse | null;
  onAiDraftPrefillApplied?: () => void;
  onDocumentAutoFillControlsChange?: (
    controls: IdeaDocumentAutoFillControls,
  ) => void;
  onCancelReady?: (handleCancel: () => void) => void;
};

export function IdeaCreateForm({
  aiDraftPrefill,
  onAiDraftPrefillApplied,
  onDocumentAutoFillControlsChange,
  onCancelReady,
}: IdeaCreateFormProps) {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const formId = useId();
  const problemSelectRef = useRef<ProblemSelectHandle>(null);

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
    isEditing,
    isBusy,
    isSavingDraft,
    isPublishing,
    isHydrating,
    error,
    clearError,
    hasUnsavedProgress,
    clearCreateIdeaSession,
  } = useIdeaCreateForm();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const isMobile = useMediaQuery('(max-width: 768px)');

  const titleValue = watch('title') || '';
  const descriptionValue = watch('description') || '';
  const trimmedTitle = titleValue.trim();
  const trimmedDescription = descriptionValue.trim();

  const {
    canRegenerateTitle,
    canGenerateImage,
    openAssistModal,
    generationModalProps,
  } = useIdeaCreateAiAssist({
    form,
    trimmedTitle,
    trimmedDescription,
    setMainImage,
    aiDraftPrefill,
    onAiDraftPrefillApplied,
  });

  const { isScanning, handleFileSelected, confirmModalProps } =
    useDocumentAutoFill({
      entityType: 'idea',
      form,
    });

  const formBusy = isBusy || isScanning;
  const formOpenedAtRef = useRef(Date.now());
  const allowNextLeaveRef = useRef<(continueLeave: () => void) => void>(
    () => {},
  );
  const handleSaveDraftRef = useRef<(() => Promise<boolean>) | null>(null);

  const onControlsChangeRef = useRef(onDocumentAutoFillControlsChange);

  useEffect(() => {
    onControlsChangeRef.current = onDocumentAutoFillControlsChange;
  }, [onDocumentAutoFillControlsChange]);

  useEffect(() => {
    onControlsChangeRef.current?.({
      isScanning,
      handleFileSelected,
      disabled: formBusy,
    });
  }, [formBusy, handleFileSelected, isScanning]);

  const {
    leaveModalOpen,
    requestLeave,
    allowNextLeave,
    handleLeaveModalOpenChange,
    handleDiscard,
    handleSaveAsDraft: handleLeaveSaveAsDraft,
  } = useCreateFormLeaveGuard({
    hasUnsavedProgress,
    isBusy: formBusy,
    onSaveDraft: async () => (await handleSaveDraftRef.current?.()) ?? false,
    onDiscard: clearCreateIdeaSession,
  });

  allowNextLeaveRef.current = allowNextLeave;

  const getFilledFields = () => {
    const values = form.getValues();
    const filled: string[] = [];
    if (values.stage) filled.push('stage');
    if (values.problemId) filled.push('problem');
    if (values.title?.trim()) filled.push('title');
    if (values.description?.trim()) filled.push('description');
    if (values.mainImage) filled.push('main_image');
    if (values.tags?.trim()) filled.push('tags');
    if (values.files?.length) filled.push('files');
    return filled;
  };

  const handleDiscardWithTracking = () => {
    posthog.capture('idea_creation_abandoned', {
      fields_filled: getFilledFields(),
      time_spent_seconds: Math.round((Date.now() - formOpenedAtRef.current) / 1000),
    });
    handleDiscard();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/png': [],
      'image/jpeg': [],
      'image/webp': [],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: formBusy,
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
        message: tooLarge
          ? FILE_TOO_LARGE_MESSAGE
          : INVALID_MAIN_IMAGE_TYPE_MESSAGE,
      });
    },
  });

  const onCancelReadyRef = useRef(onCancelReady);

  useEffect(() => {
    onCancelReadyRef.current = onCancelReady;
  }, [onCancelReady]);

  const handleCancel = () => {
    requestLeave(() => {
      if (isEditing) {
        void navigate({ to: ROUTES.profileIdeas, search: { tab: 'drafts' } });
      } else {
        void navigate({ to: ROUTES.ideas, search: { sort: 'newest' } });
      }
    });
  };

  const handleCancelRef = useRef(handleCancel);
  handleCancelRef.current = handleCancel;

  useEffect(() => {
    onCancelReadyRef.current?.(() => handleCancelRef.current());
  }, []);

  const navigateToIdeaDetail = (
    ideaId: string,
    search?: { updated?: boolean },
  ) => {
    void navigate({
      to: '/ideas/$ideaId',
      params: { ideaId },
      search: search ?? {},
      replace: true,
    });
  };

  const handleSaveDraft = async (): Promise<boolean> => {
    const wasEditing = isEditing;
    const result = await onSaveDraft();
    if (!result.success) return false;

    posthog.capture('idea_draft_saved', { idea_id: result.ideaId, is_editing: wasEditing });

    if (wasEditing) {
      navigateToIdeaDetail(result.ideaId);
      return true;
    }

    allowNextLeaveRef.current(() => {
      void navigate({ to: ROUTES.ideas, search: { sort: 'newest' } });
    });
    return true;
  };

  handleSaveDraftRef.current = handleSaveDraft;

  const handlePublish = async () => {
    const wasEditing = isEditing;
    const publishResult = await onPublish();
    if (!publishResult.success) {
      if (publishResult.firstInvalidField) {
        focusPublishField(publishResult.firstInvalidField, {
          problemId: problemSelectRef.current,
        });
      }
      return;
    }

    posthog.capture('idea_published', { idea_id: publishResult.ideaId, is_editing: wasEditing, action: publishResult.action });

    if (wasEditing) {
      navigateToIdeaDetail(publishResult.ideaId, {
        updated: publishResult.action === 'update',
      });
      return;
    }

    allowNextLeaveRef.current(() => {
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
          <FieldGroup data-publish-field="stage">
            <FieldLabel htmlFor={`${formId}-stage`} required>
              Stage
            </FieldLabel>
            <Controller
              name="stage"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={formBusy}
                >
                  <SelectTrigger
                    id={`${formId}-stage`}
                    className={cn(
                      selectClass,
                      'mt-2 w-full data-[size=default]:h-10',
                    )}
                    aria-invalid={!!errors.stage}
                  >
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {IDEA_STAGES.map(stage => (
                      <SelectItem
                        key={stage.value}
                        value={stage.value}
                        className="px-3 py-1"
                      >
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.stage?.message} />
          </FieldGroup>

          <ProblemSelect
            ref={problemSelectRef}
            formId={formId}
            control={control}
            errors={errors}
            createdProblems={createdProblems}
            onProblemDraftCreated={onProblemDraftCreated}
          />
        </div>

        <FieldGroup data-publish-field="title">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <FieldLabel htmlFor={`${formId}-title`} required>
              Title
            </FieldLabel>
            <IdeaCreateAiAssistLink
              disabled={!canRegenerateTitle}
              onClick={
                canRegenerateTitle
                  ? () => {
                      posthog.capture('idea_ai_assist_used', { tool: 'title' });
                      openAssistModal('title');
                    }
                  : undefined
              }
            >
              {titleValue
                ? 'Re-generate title from description'
                : 'Generate title from description'}
            </IdeaCreateAiAssistLink>
          </div>
          <Input
            id={`${formId}-title`}
            className="bg-card mt-2"
            placeholder="Type in the name of the idea..."
            aria-invalid={!!errors.title}
            disabled={formBusy}
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

        <FieldGroup data-publish-field="description">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <FieldLabel htmlFor={`${formId}-description`} required>
              Description
            </FieldLabel>
            <IdeaCreateAiAssistLink
              onClick={() => {
                posthog.capture('idea_ai_assist_used', { tool: 'description' });
                openAssistModal('description');
              }}
            >
              {descriptionValue
                ? 'Edit description with AI prompt'
                : 'Write description with AI prompt'}
            </IdeaCreateAiAssistLink>
          </div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                id={`${formId}-description`}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={formBusy}
                aria-invalid={!!errors.description}
              />
            )}
          />
          <div className="flex items-start justify-between gap-4 pt-1">
            <FieldError message={errors.description?.message} />
            <span className="text-brand-gray-500 ml-auto text-xs">
              {descriptionValue.length}/5000
            </span>
          </div>
        </FieldGroup>

        <FieldGroup data-publish-field="mainImage">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <FieldLabel
              required
              hint="This will be the main image for your idea"
            >
              Main image
            </FieldLabel>

            <IdeaCreateAiAssistLink
              disabled={!canGenerateImage}
              onClick={
                canGenerateImage
                  ? () => {
                      posthog.capture('idea_ai_assist_used', { tool: 'image' });
                      openAssistModal('image');
                    }
                  : undefined
              }
            >
              Generate image from title &amp; description
            </IdeaCreateAiAssistLink>
          </div>
          <Controller
            name="mainImage"
            control={control}
            render={() => (
              <div className="flex flex-col">
                <div
                  {...getRootProps()}
                  className={cn(
                    'border-brand-gray-200 hover:border-brand-dark-blue/40 focus-visible:ring-ring bg-card mt-2 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-4 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    isDragActive && 'border-brand-dark-blue bg-brand-gray-100',
                    errors.mainImage && 'border-destructive',
                    formBusy && 'cursor-not-allowed opacity-50',
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
                        isBusy={false}
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

        <SuggestedTagsField
          formId={formId}
          control={control}
          errors={errors}
          disabled={formBusy}
          context="idea"
        />

        <FieldGroup>
          <FieldLabel>Files</FieldLabel>
          <IdeaFilesField
            control={control}
            disabled={formBusy}
            onFilesModified={clearError}
            ideaTitle={trimmedTitle}
            ideaDescription={trimmedDescription}
          />
          <FieldError message={errors.files?.message} />
        </FieldGroup>

        <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:items-center md:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={formBusy}
            className="text-brand-orange hover:text-brand-orange-hover border-brand-orange rounded-md border py-2 text-sm font-bold tracking-wide uppercase transition-colors disabled:opacity-50 md:border-none md:px-2 md:py-0"
          >
            Cancel
          </button>
          {!isPublishedIdea ? (
            <Button
              type="button"
              variant="outline"
              className={cn(outlineBtnClass, isMobile && 'w-full')}
              onClick={() => void handleSaveDraft()}
              disabled={formBusy}
              isLoading={isSavingDraft}
            >
              Save as draft
            </Button>
          ) : null}
          <Button
            type="submit"
            className={cn(publishBtnClass, isMobile && 'w-full')}
            disabled={formBusy}
            isLoading={isPublishing}
          >
            {isPublishedIdea ? 'Save changes' : 'Publish idea'}
          </Button>
        </div>
      </form>

      <SaveProgressBeforeLeavingModal
        open={!isEditing && leaveModalOpen}
        onOpenChange={handleLeaveModalOpenChange}
        onDiscard={handleDiscardWithTracking}
        onSaveAsDraft={() => void handleLeaveSaveAsDraft()}
        isSaving={isSavingDraft}
        description={SAVE_IDEA_PROGRESS_DESCRIPTION}
      />

      {isEditing ? (
        <ConfirmModal
          open={leaveModalOpen}
          onOpenChange={handleLeaveModalOpenChange}
          title={UNDO_CHANGES_TITLE}
          description={UNDO_CHANGES_DESCRIPTION}
          confirmLabel="YES"
          cancelLabel="NO"
          onConfirm={handleDiscard}
        />
      ) : null}

      <AiGenerationModal {...generationModalProps} />

      <ConfirmModal {...confirmModalProps} />
    </>
  );
}
