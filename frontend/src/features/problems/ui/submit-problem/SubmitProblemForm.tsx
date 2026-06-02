import { publishBtnClass, textareaClass } from '@/features/ideas/lib/styles';
import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/features/ideas/ui/create-idea/Fields';
import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';
import { DEFAULT_PROBLEMS_DASHBOARD_SEARCH } from '@/features/problems-dashboard/lib/constants';
import { useSubmitProblemForm } from '@/features/problems/hooks/use-submit-problem-form';
import {
  PROBLEM_STAGES,
  hasSubmitProblemUnsavedProgress,
  sanitizeCostBenefitInput,
} from '@/features/problems/lib/submit-problem';
import { SaveDraftButton } from '@/features/problems/ui/tooltips';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { Controller } from 'react-hook-form';

import { ROUTES } from '@/shared/config/paths';
import { useCreateFormLeaveGuard } from '@/shared/hooks/use-create-form-leave-guard';
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

import { IdeaSelect } from './IdeaSelect';
import { ProblemFilesField } from './ProblemFilesField';
import { ProblemTagsField } from './ProblemTagsField';

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

const POST_PUBLISH_PROMPT =
  'Would you like to add more details to the Problem you created?';

export function SubmitProblemForm() {
  const navigate = useNavigate();
  const formId = useId();
  const [isPostPublishModalOpen, setIsPostPublishModalOpen] = useState(false);
  const [publishedProblemId, setPublishedProblemId] = useState<string | null>(
    null,
  );

  const {
    form,
    error,
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
    handleSubmit,
    formState: { errors, isDirty: formIsDirty },
    watch,
  } = form;

  const titleValue = watch('title') || '';
  const descriptionValue = watch('description') || '';
  const valuePropositionValue = watch('valueProposition') || '';
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
    isBusy,
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
    if (wasEditing) {
      navigateAfterSave(wasEditing, problemId);
      return;
    }
    setPublishedProblemId(problemId);
    setIsPostPublishModalOpen(true);
  };

  const handlePostPublishModalOpenChange = (open: boolean) => {
    setIsPostPublishModalOpen(open);
    if (!open) {
      setPublishedProblemId(null);
    }
  };

  const handleOpenPublishedProblemDetails = () => {
    if (!publishedProblemId) return;
    setIsPostPublishModalOpen(false);
    void navigate({ to: ROUTES.problemDetail(publishedProblemId) });
  };

  return (
    <>
      <form
        id={formId}
        className="space-y-8"
        onSubmit={e => void handleSubmit(handlePublish)(e)}
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
          <div className="relative mt-2 max-w-md">
            <select
              id={`${formId}-stage`}
              className={cn(selectClass, 'pr-9')}
              aria-invalid={!!errors.stage}
              disabled={isBusy}
              {...register('stage')}
            >
              {PROBLEM_STAGES.map(stage => (
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
          <div className="flex flex-wrap items-end justify-between gap-2">
            <FieldLabel htmlFor={`${formId}-title`} required>
              Problem Title
            </FieldLabel>
            <AiAssistLink>Generate title from description</AiAssistLink>
          </div>
          <Input
            id={`${formId}-title`}
            className="mt-2 bg-white"
            placeholder="Keep it short and specific, e.g., 'Low visibility into equipment usage'..."
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
            placeholder="Add context, why this is a problem, and who it affects..."
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
          <div className="flex flex-wrap items-end justify-between gap-2">
            <FieldLabel htmlFor={`${formId}-valueProposition`}>
              Value Proposition
            </FieldLabel>
            <AiAssistLink>Write value proposition with AI prompt</AiAssistLink>
          </div>
          <textarea
            id={`${formId}-valueProposition`}
            className={cn(textareaClass, 'mt-2')}
            placeholder="What are the potential benefits of solving this problem?"
            aria-invalid={!!errors.valueProposition}
            disabled={isBusy}
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
                  className="bg-white pl-7"
                  placeholder="1000.00"
                  maxLength={13}
                  inputMode="decimal"
                  aria-invalid={!!errors.costBenefit}
                  disabled={isBusy}
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
          disabled={isBusy}
        />

        <FieldGroup>
          <FieldLabel>Files</FieldLabel>
          <ProblemFilesField control={control} disabled={isBusy} />
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
          {!isEditing ? (
            <SaveDraftButton
              canSave={canSaveDraft}
              isSaving={isSavingDraft}
              disabled={isBusy}
              onSave={() => void handleSaveDraft()}
            />
          ) : null}
          <Button
            type="submit"
            className={publishBtnClass}
            disabled={isBusy}
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

      <ConfirmModal
        open={isPostPublishModalOpen}
        onOpenChange={handlePostPublishModalOpenChange}
        title={POST_PUBLISH_PROMPT}
        description=""
        confirmLabel="Open Problem Details"
        cancelLabel="Not Now"
        onConfirm={handleOpenPublishedProblemDetails}
      />
    </>
  );
}
