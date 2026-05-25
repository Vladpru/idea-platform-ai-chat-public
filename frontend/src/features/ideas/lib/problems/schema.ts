import { z } from 'zod';

export const addProblemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title is required and must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .trim()
    .min(8, 'Description is required and must be at least 8 characters'),
});

export type AddProblemValues = z.infer<typeof addProblemSchema>;

export const addProblemDefaultValues: AddProblemValues = {
  title: '',
  description: '',
};
