import { z } from 'zod';

export const addProblemSchema = z.object({
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
});

export type AddProblemValues = z.infer<typeof addProblemSchema>;

export const addProblemDefaultValues: AddProblemValues = {
  title: '',
  description: '',
};
