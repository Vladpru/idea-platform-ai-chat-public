import { z } from 'zod';

import { IDEA_STAGES } from './idea-stages';

const ideaStageValues = IDEA_STAGES.map(stage => stage.value);

export const ideaStageSchema = z.enum(ideaStageValues);

const fileSchema = z.custom<File>(
  value => typeof File !== 'undefined' && value instanceof File,
  { message: 'Invalid file' },
);

const mainImageSchema = fileSchema.refine(file => file.type.startsWith('image/'), {
  message: 'Main image must be an image file',
});

export const ideaCreateSchema = z.object({
  stage: ideaStageSchema,
  problemId: z.string().min(1, 'Choose a problem'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string().trim().min(1, 'Description is required'),
  tags: z.string().optional(),
  mainImage: mainImageSchema,
  files: z.array(fileSchema).optional(),
});

export const ideaCreateDraftSchema = z.object({
  stage: ideaStageSchema,
  problemId: z.string().optional(),
  title: z.string().max(200, 'Title must be at most 200 characters').optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  mainImage: mainImageSchema.optional(),
  files: z.array(fileSchema).optional(),
});

export type IdeaCreateValues = z.infer<typeof ideaCreateSchema>;
export type IdeaCreateDraftValues = z.infer<typeof ideaCreateDraftSchema>;

/** Form state before required fields (e.g. main image) are set. */
export type IdeaCreateFormValues = Omit<IdeaCreateValues, 'mainImage'> & {
  mainImage?: File;
};

export const ideaCreateDefaultValues: IdeaCreateFormValues = {
  stage: 'ideation',
  problemId: '',
  title: '',
  description: '',
  tags: '',
  files: [],
};
