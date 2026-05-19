import { z } from 'zod';

export const addProblemSchema = z.object({
  title: z.string().trim().min(1, 'Problem title is required'),
  description: z.string().trim().min(1, 'Description is required'),
});

export type AddProblemValues = z.infer<typeof addProblemSchema>;

export const addProblemDefaultValues: AddProblemValues = {
  title: '',
  description: '',
};
