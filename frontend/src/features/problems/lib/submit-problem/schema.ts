import { z } from 'zod';
import {
  isAllowedAttachment,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_FILES,
} from '@/features/ideas/lib/create-idea/attachments';
import { submitProblemCostBenefitSchema } from './cost-benefit';
import { PROBLEM_STAGES, type ProblemStageValue } from './stages';

const fileSchema = z.custom<File>(
  value => typeof File !== 'undefined' && value instanceof File,
  { message: 'Invalid file' },
);

const attachmentFileSchema = fileSchema
  .refine(file => isAllowedAttachment(file), {
    message: 'Only images, PDF, and DOCX files are allowed',
  })
  .refine(file => file.size <= MAX_ATTACHMENT_BYTES, {
    message: 'Each file must be 5 MB or less',
  });

const attachmentsSchema = z
  .array(attachmentFileSchema)
  .max(MAX_ATTACHMENT_FILES, `You can add up to ${MAX_ATTACHMENT_FILES} files`);

const problemStageValues = PROBLEM_STAGES.map(stage => stage.value) as [
  ProblemStageValue,
  ...ProblemStageValue[],
];

export const problemStageSchema = z.enum(problemStageValues);

export const submitProblemTitleSchema = z
  .string()
  .trim()
  .min(1, 'This field is required')
  .min(3, 'Title must be at least 3 characters')
  .max(200, 'Title cannot exceed 200 characters');

export const submitProblemDescriptionSchema = z
  .string()
  .trim()
  .min(1, 'This field is required')
  .min(8, 'Description must be at least 8 characters')
  .max(5000, 'Description cannot exceed 5000 characters');

const submitProblemCoreFields = {
  stage: problemStageSchema,
  title: submitProblemTitleSchema,
  description: z
    .string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional(),
  valueProposition: z
    .string()
    .max(5000, 'Value proposition cannot exceed 5000 characters')
    .optional(),
  costBenefit: submitProblemCostBenefitSchema,
  ideaIds: z.string().optional(),
  tags: z.string().optional(),
  files: attachmentsSchema.optional(),
};

export const submitProblemDraftSchema = z.object(submitProblemCoreFields);

export const submitProblemPublishSchema = z.object({
  ...submitProblemCoreFields,
  description: submitProblemDescriptionSchema,
});

export type SubmitProblemFormValues = z.infer<typeof submitProblemDraftSchema>;

export const submitProblemDefaultValues: SubmitProblemFormValues = {
  stage: 'active',
  title: '',
  description: '',
  valueProposition: '',
  costBenefit: '',
  ideaIds: '',
  tags: '',
  files: [],
};

const submitProblemDraftSaveSchema = z.object({
  title: submitProblemTitleSchema,
  description: z
    .string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional(),
});

export function validateSubmitProblemForDraft(values: SubmitProblemFormValues) {
  return submitProblemDraftSaveSchema.safeParse(values);
}

export function validateSubmitProblemForPublish(
  values: SubmitProblemFormValues,
) {
  return submitProblemPublishSchema.safeParse(values);
}
