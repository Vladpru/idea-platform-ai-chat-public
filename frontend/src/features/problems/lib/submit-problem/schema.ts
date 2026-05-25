import {
  isAllowedAttachment,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_FILES,
} from '@/features/ideas/lib/create-idea/attachments';
import { z } from 'zod';

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

import { submitProblemCostBenefitSchema } from './cost-benefit';
import { PROBLEM_STAGES, type ProblemStageValue } from './stages';

const problemStageValues = PROBLEM_STAGES.map(stage => stage.value) as [
  ProblemStageValue,
  ...ProblemStageValue[],
];

export const problemStageSchema = z.enum(problemStageValues);

/** Matches backend `PROBLEM_TITLE_MIN_LENGTH` / DTO max length. */
export const submitProblemTitleSchema = z
  .string()
  .trim()
  .min(3, 'Title is required and must be at least 3 characters')
  .max(200, 'Title must be at most 200 characters');

/** Matches backend `PROBLEM_DESCRIPTION_MIN_LENGTH`. */
export const submitProblemDescriptionSchema = z
  .string()
  .trim()
  .min(8, 'Description is required and must be at least 8 characters');

const submitProblemCoreFields = {
  stage: problemStageSchema,
  title: submitProblemTitleSchema,
  description: submitProblemDescriptionSchema,
  valueProposition: z.string().optional(),
  costBenefit: submitProblemCostBenefitSchema,
  ideaIds: z.string().optional(),
  tags: z.string().optional(),
  files: attachmentsSchema.optional(),
};

export const submitProblemDraftSchema = z.object(submitProblemCoreFields);

export const submitProblemPublishSchema = z.object(submitProblemCoreFields);

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

export function validateSubmitProblemForDraft(values: SubmitProblemFormValues) {
  return submitProblemDraftSchema.safeParse(values);
}

export function validateSubmitProblemForPublish(values: SubmitProblemFormValues) {
  return submitProblemPublishSchema.safeParse(values);
}
