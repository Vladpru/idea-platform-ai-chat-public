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

import { PROBLEM_STAGES, type ProblemStageValue } from './stages';

const problemStageValues = PROBLEM_STAGES.map(stage => stage.value) as [
  ProblemStageValue,
  ...ProblemStageValue[],
];

export const problemStageSchema = z.enum(problemStageValues);

export const submitProblemDraftSchema = z.object({
  stage: problemStageSchema,
  title: z.string().max(200, 'Title must be at most 200 characters').optional(),
  description: z.string().optional(),
  valueProposition: z.string().optional(),
  costBenefit: z.string().optional(),
  ideaIds: z.string().optional(),
  tags: z.string().optional(),
  files: attachmentsSchema.optional(),
});

export const submitProblemPublishSchema = z.object({
  stage: problemStageSchema,
  title: z
    .string()
    .trim()
    .min(1, 'Problem title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string().trim().min(1, 'Description is required'),
  valueProposition: z.string().optional(),
  costBenefit: z.string().optional(),
  ideaIds: z.string().optional(),
  tags: z.string().optional(),
  files: attachmentsSchema.optional(),
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

export function validateSubmitProblemForPublish(values: SubmitProblemFormValues) {
  return submitProblemPublishSchema.safeParse(values);
}
