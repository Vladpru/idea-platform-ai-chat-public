import { publishBtnClass, textareaClass } from '@/features/ideas/lib/styles';
import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/features/ideas/ui/create-idea/Fields';
import { IdeaCreateAiAssistLink } from '@/features/ideas/ui/create-idea/IdeaCreateAiAssistLink';
import { AiGenerationModal } from '@/features/ideas/ui/modals/AiGenerationModal';
import { DEFAULT_PROBLEMS_DASHBOARD_SEARCH } from '@/features/problems-dashboard/lib/constants';
import { useSubmitProblemAiAssist } from '@/features/problems/hooks/use-submit-problem-ai-assist';
import { useSubmitProblemForm } from '@/features/problems/hooks/use-submit-problem-form';
import {
  PROBLEM_STAGES,
  hasSubmitProblemUnsavedProgress,
  sanitizeCostBenefitInput,
} from '@/features/problems/lib/submit-problem';
import { SaveDraftButton } from '@/features/problems/ui/tooltips';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useId } from 'react';
import { Controller } from 'react-hook-form';

import { ROUTES } from '@/shared/config/paths';
import { useCreateFormLeaveGuard } from '@/shared/hooks/use-create-form-leave-guard';
import { useDocumentAutoFill } from '@/shared/hooks/use-document-auto-fill';
import {
  SAVE_PROBLEM_PROGRESS_DESCRIPTION,
  UNDO_CHANGES_DESCRIPTION,
  UNDO_CHANGES_TITLE,
} from '@/shared/lib/create-form-leave/copy';
import { cn } from '@/shared/lib/utils';
import { selectClass } from '@/shared/ui/TagsInput';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import { Input } from '@/shared/ui/input';
import { SaveProgressBeforeLeavingModal } from '@/shared/ui/save-progress-before-leaving-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

import { IdeaSelect } from './IdeaSelect';
import { ProblemFilesField } from './ProblemFilesField';
import { ProblemTagsField } from './ProblemTagsField';
import { SimilarProblemsSection } from './SimilarProblemsSection';

export type ProblemDocumentAutoFillControls = {
  isScanning: boolean;
  handleFileSelected: (file: File) => void;
  disabled: boolean;
};

type SubmitProblemFormProps = {
  onDocumentAutoFillControlsChange?: (
    controls: ProblemDocumentAutoFillControls,
  ) => void;
};

export function SubmitProblemForm({
  onDocumentAutoFillControlsChange,
}: SubmitProblemFormProps) {
  const navigate = useNavigate();
  const { problemId: editingProblemId } = useSearch({
    from: '/_auth/problems/new',
  });
  const formId = useId();

  const {
    form,
    error,
    clearError,
    isBusy,
    isHydrating,
    isSavingDraft,
    isPublishing,
    isEditing,
    onSaveDraft,
    onPublish,
    canSaveDraft,
    clearSession,
  } = useSubmitProblemForm();

  const {
    register,
    control,
    formState: { errors, isDirty: formIsDirty },
    watch,
  } = form;

  const titleValue = watch('title') || '';
  const descriptionValue = watch('description') || '';
  const valuePropositionValue = watch('valueProposition') || '';
  const trimmedTitle = titleValue.trim();
  const trimmedDescription = descriptionValue.trim();

  const { canRegenerateTitle, openAssistModal, generationModalProps } =
    useSubmitProblemAiAssist({
      form,
      trimmedTitle,
      trimmedDescription,
    });

  const { isScanning, handleFileSelected, confirmModalProps } =
    useDocumentAutoFill({
      entityType: 'problem',
      form,
    });

  const formBusy = isBusy || isScanning;

  useEffect(() => {
    onDocumentAutoFillControlsChange?.({
      isScanning,
      handleFileSelected,
      disabled: formBusy,
    });
  }, [
    formBusy,
    handleFileSelected,
    isScanning,
    onDocumentAutoFillControlsChange,
  ]);

  const watchedValues = watch();
  const hasUnsavedProgress = hasSubmitProblemUnsavedProgress(
    formIsDirty,
    watchedValues,
    isEditing,
  );

  const navigateToProblems = () => {
    void navigate({
      to: ROUTES.problems,
      search: DEFAULT_PROBLEMS_DASHBOARD_SEARCH,
    });
  };

  const navigateAfterSave = (wasEditing: boolean, problemId: string) => {
    if (wasEditing) {
      void navigate({ to: ROUTES.problemDetail(problemId) });
      return;
    }
    navigateToProblems();
  };

  const {
    leaveModalOpen,
    requestLeave,
    handleLeaveModalOpenChange,
    handleDiscard,
    handleSaveAsDraft: handleLeaveSaveAsDraft,
  } = useCreateFormLeaveGuard({
    hasUnsavedProgress,
    isBusy: formBusy,
    onSaveDraft: async () => {
      const wasEditing = isEditing;
      const problemId = await onSaveDraft();
      if (!problemId) return false;
      navigateAfterSave(wasEditing, problemId);
      return true;
    },
    onDiscard: clearSession,
  });

  const handleCancel = () => {
    requestLeave(navigateToProblems);
  };

  const handleSaveDraft = async () => {
    const wasEditing = isEditing;
    const problemId = await onSaveDraft();
    if (!problemId) return;
    navigateAfterSave(wasEditing, problemId);
  };

  const handlePublish = async () => {
    const wasEditing = isEditing;
    const problemId = await onPublish();
    if (!problemId) return;
    void navigate({
      to: ROUTES.problemDetail(problemId),
      search: wasEditing ? { updated: true } : undefined,
      replace: true,
    });
  };

  return (
    <>
      <form
        id={formId}
        className="space-y-8"
        onSubmit={event => {
          event.preventDefault();
          void handlePublish();
        }}
        noValidate
      >
        {isHydrating ? (
          <p className="text-brand-gray-600 text-sm">Loading problem…</p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="text-destructive rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
          >
            {error}
          </p>
        ) : null}

        <FieldGroup>
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
                    'mt-2 w-full max-w-md data-[size=default]:h-10',
                  )}
                  aria-invalid={!!errors.stage}
                >
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEM_STAGES.map(stage => (
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
          <div className="flex flex-wrap items-end justify-between gap-2">
            <FieldLabel htmlFor={`${formId}-title`} required>
              Problem Title
            </FieldLabel>
            <IdeaCreateAiAssistLink
              disabled={formBusy || !canRegenerateTitle}
              onClick={
                canRegenerateTitle && !formBusy
                  ? () => openAssistModal('title')
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
            placeholder="Keep it short and specific, e.g., 'Low visibility into equipment usage'..."
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

        <FieldGroup>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <FieldLabel htmlFor={`${formId}-description`} required>
              Description
            </FieldLabel>
            <IdeaCreateAiAssistLink
              disabled={formBusy}
              onClick={
                formBusy ? undefined : () => openAssistModal('description')
              }
            >
              {descriptionValue
                ? 'Edit description with AI prompt'
                : 'Write description with AI prompt'}
            </IdeaCreateAiAssistLink>
          </div>
          <textarea
            id={`${formId}-description`}
            className={cn(textareaClass, 'mt-2')}
            placeholder="Add context, why this is a problem, and who it affects..."
            aria-invalid={!!errors.description}
            disabled={formBusy}
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
          <div className="flex flex-wrap items-end justify-between gap-2">
            <FieldLabel htmlFor={`${formId}-valueProposition`}>
              Value Proposition
            </FieldLabel>
            <IdeaCreateAiAssistLink
              disabled={formBusy}
              onClick={
                formBusy ? undefined : () => openAssistModal('valueProposition')
              }
            >
              {valuePropositionValue
                ? 'Edit value proposition with AI prompt'
                : 'Write value proposition with AI prompt'}
            </IdeaCreateAiAssistLink>
          </div>
          <textarea
            id={`${formId}-valueProposition`}
            className={cn(textareaClass, 'mt-2')}
            placeholder="What are the potential benefits of solving this problem?"
            aria-invalid={!!errors.valueProposition}
            disabled={formBusy}
            maxLength={5000}
            {...register('valueProposition')}
          />
          <div className="flex items-start justify-between gap-4 pt-1">
            <FieldError message={errors.valueProposition?.message} />
            <span className="text-brand-gray-500 ml-auto text-xs">
              {valuePropositionValue.length}/5000
            </span>
          </div>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor={`${formId}-costBenefit`}>
            Potential Cost Benefit
          </FieldLabel>
          <div className="relative mt-2 max-w-md">
            <span
              className="text-brand-gray-600 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium"
              aria-hidden
            >
              $
            </span>
            <Controller
              name="costBenefit"
              control={control}
              render={({ field }) => (
                <Input
                  id={`${formId}-costBenefit`}
                  className="bg-card pl-7"
                  placeholder="1000.00"
                  maxLength={13}
                  inputMode="decimal"
                  aria-invalid={!!errors.costBenefit}
                  disabled={formBusy}
                  value={field.value ?? ''}
                  onChange={event =>
                    field.onChange(sanitizeCostBenefitInput(event.target.value))
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
          </div>
          <FieldError message={errors.costBenefit?.message} />
        </FieldGroup>

        <IdeaSelect formId={formId} control={control} errors={errors} />

        <ProblemTagsField
          formId={formId}
          control={control}
          errors={errors}
          disabled={formBusy}
        />

        <FieldGroup>
          <FieldLabel>Files</FieldLabel>
          <ProblemFilesField
            control={control}
            disabled={formBusy}
            onFilesModified={clearError}
          />
          <FieldError message={errors.files?.message} />
        </FieldGroup>

        <SimilarProblemsSection
          title={titleValue}
          description={descriptionValue}
          excludeProblemId={editingProblemId}
        />

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={formBusy}
            className="text-brand-orange hover:text-brand-orange-hover px-2 text-sm font-bold tracking-wide uppercase transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {!isEditing ? (
            <SaveDraftButton
              canSave={canSaveDraft}
              isSaving={isSavingDraft}
              disabled={formBusy}
              onSave={() => void handleSaveDraft()}
            />
          ) : null}
          <Button
            type="submit"
            className={publishBtnClass}
            disabled={formBusy}
            isLoading={isPublishing}
          >
            {isEditing ? 'Save changes' : 'Publish problem'}
          </Button>
        </div>
      </form>

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
      ) : (
        <SaveProgressBeforeLeavingModal
          open={leaveModalOpen}
          onOpenChange={handleLeaveModalOpenChange}
          onDiscard={handleDiscard}
          onSaveAsDraft={() => void handleLeaveSaveAsDraft()}
          isSaving={isSavingDraft}
          description={SAVE_PROBLEM_PROGRESS_DESCRIPTION}
        />
      )}

      <AiGenerationModal {...generationModalProps} />

      <ConfirmModal {...confirmModalProps} />
    </>
  );
}
