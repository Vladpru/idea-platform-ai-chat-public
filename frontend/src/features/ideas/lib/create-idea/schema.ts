import { z } from 'zod';

import {
  isAllowedAttachment,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_FILES,
} from './attachments';
import { IDEA_STAGES } from '../stages';

const ideaStageValues = IDEA_STAGES.map(stage => stage.value);

export const ideaStageSchema = z.enum(ideaStageValues);

const fileSchema = z.custom<File>(
  value => typeof File !== 'undefined' && value instanceof File,
  { message: 'Invalid file' },
);

const mainImageSchema = fileSchema.refine(
  file => file.type.startsWith('image/'),
  {
    message: 'Main image must be an image file',
  },
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

export const ideaCreateSchema = z.object({
  stage: ideaStageSchema,
  problemId: z.string().min(1, 'Choose a problem'),
  title: z
    .string()
    .trim()
    .min(1, 'This field is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'This field is required')
    .max(5000, 'Description cannot exceed 5000 characters'),
  tags: z.string().optional(),
  mainImage: mainImageSchema,
  files: attachmentsSchema.optional(),
});

export const ideaCreateDraftSchema = z.object({
  stage: ideaStageSchema,
  problemId: z.string().optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional(),
  tags: z.string().optional(),
  mainImage: mainImageSchema.optional(),
  files: attachmentsSchema.optional(),
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

type PublishValidationOptions = {
  hasRemoteMainImage: boolean;
};

export function validateForPublish(
  values: IdeaCreateFormValues,
  { hasRemoteMainImage }: PublishValidationOptions,
) {
  const hasLocalMainImage = values.mainImage instanceof File;

  if (!hasLocalMainImage && !hasRemoteMainImage) {
    const withoutImage = ideaCreateSchema.omit({ mainImage: true }).safeParse(values);
    if (!withoutImage.success) return withoutImage;

    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: 'Main image is required',
          path: ['mainImage'],
        },
      ]),
    };
  }

  if (!hasLocalMainImage && hasRemoteMainImage) {
    return ideaCreateSchema.omit({ mainImage: true }).safeParse(values);
  }

  return ideaCreateSchema.safeParse(values);
}
