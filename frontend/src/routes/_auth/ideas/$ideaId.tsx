import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';

const ideaDetailsParamsSchema = z.object({
  ideaId: z.string().min(1),
});

export const Route = createFileRoute('/_auth/ideas/$ideaId')({
  parseParams: raw => ideaDetailsParamsSchema.parse(raw),
  component: () => <Outlet />,
});
