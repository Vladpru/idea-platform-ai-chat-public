import { z } from 'zod';

import {
  isAllowedAttachment,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_FILES,
} from '@/features/ideas/lib/create-idea/attachments';
import { ideaStageSchema } from '@/features/ideas/lib/create-idea/schema';

const fileSchema = z.custom<File>(
  value => typeof File !== 'undefined' && value instanceof File,
  { message: 'Invalid file' },
);

const mainImageSchema = fileSchema.refine(file => file.type.startsWith('image/'), {
  message: 'Main image must be an image file',
});

const attachmentFileSchema = fileSchema
  .refine(file => isAllowedAttachment(file), {
    message: 'Only images, PDF, and DOCX files are allowed',
  })
  .refine(file => file.size <= MAX_ATTACHMENT_BYTES, {
    message: 'Each file must be 5 MB or less',
  });

const newAttachmentsSchema = z
  .array(attachmentFileSchema)
  .max(MAX_ATTACHMENT_FILES, `You can add up to ${MAX_ATTACHMENT_FILES} files`);

export const existingMainImageSchema = z
  .object({
    id: z.string().uuid(),
    url: z.string().url(),
  })
  .nullable();

export const existingAttachmentSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  filename: z.string(),
});

export const ideaEditSchema = z
  .object({
    stage: ideaStageSchema,
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must be at most 200 characters'),
    description: z
      .string()
      .trim()
      .min(8, 'Description must be at least 8 characters'),
    tags: z.string().optional(),
    existingMainImage: existingMainImageSchema,
    removeMainImage: z.boolean(),
    mainImage: mainImageSchema.optional(),
    existingAttachments: z.array(existingAttachmentSchema),
    removedAttachmentIds: z.array(z.string().uuid()),
    newFiles: newAttachmentsSchema.optional(),
  })
  .superRefine((values, ctx) => {
    const keptAttachments = values.existingAttachments.filter(
      attachment => !values.removedAttachmentIds.includes(attachment.id),
    );
    const newCount = values.newFiles?.length ?? 0;
    const total = keptAttachments.length + newCount;

    if (total > MAX_ATTACHMENT_FILES) {
      ctx.addIssue({
        code: 'custom',
        message: `You can have at most ${MAX_ATTACHMENT_FILES} attachments`,
        path: ['newFiles'],
      });
    }
  });

export type IdeaEditFormValues = z.infer<typeof ideaEditSchema>;

export const ideaEditDefaultValues: IdeaEditFormValues = {
  stage: 'ideation',
  title: '',
  description: '',
  tags: '',
  existingMainImage: null,
  removeMainImage: false,
  existingAttachments: [],
  removedAttachmentIds: [],
  newFiles: [],
};
