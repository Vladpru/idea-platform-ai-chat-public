import type { SubmitProblemFormValues } from '@/features/problems/lib/submit-problem';
import { SuggestedTagsField } from '@/features/tags/ui/SuggestedTagsField';
import type { Control, FieldErrors } from 'react-hook-form';

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
  return (
    <SuggestedTagsField
      formId={formId}
      control={control}
      errors={errors}
      disabled={disabled}
      context="problem"
    />
  );
}
