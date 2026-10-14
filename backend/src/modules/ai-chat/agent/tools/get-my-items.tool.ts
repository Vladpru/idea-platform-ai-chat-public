import { tool } from '@langchain/core/tools';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import { getRunContext } from '../chat.types';
import { safeTool, toolOk } from './tool-utils';

const MAX_ITEMS = 20;
const logger = new Logger('GetMyItemsTool');

const ITEM_SELECT = {
  id: true,
  title: true,
  status: true,
  stage: true,
  updatedAt: true,
} as const;

type ItemRow = {
  id: string;
  title: string | null;
  status: string;
  stage: string | null;
  updatedAt: Date;
};

export function createGetMyItemsTool(
  prisma: Pick<PrismaService, 'idea' | 'problem'>,
) {
  return tool(
    async ({ type, status }, config) => {
      const context = getRunContext(config);
      return safeTool('get_my_items', logger, async () => {
        const where = {
          authorId: context.userId,
          ...(status
            ? { status }
            : {
                status: {
                  in: ['DRAFT', 'PUBLISHED'] as ('DRAFT' | 'PUBLISHED')[],
                },
              }),
        };
        const query = {
          where,
          orderBy: { updatedAt: 'desc' as const },
          take: MAX_ITEMS,
          select: ITEM_SELECT,
        };

        const [ideas, problems] = await Promise.all([
          type === 'problem'
            ? Promise.resolve([])
            : prisma.idea.findMany(query),
          type === 'idea'
            ? Promise.resolve([])
            : prisma.problem.findMany(query),
        ]);

        const items = [
          ...(ideas as ItemRow[]).map(row => ({
            ...row,
            type: 'idea' as const,
          })),
          ...(problems as ItemRow[]).map(row => ({
            ...row,
            type: 'problem' as const,
          })),
        ]
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, MAX_ITEMS)
          .map(row => ({
            type: row.type,
            id: row.id,
            title: row.title ?? 'Untitled',
            status: row.status,
            stage: row.stage,
            updatedAt: row.updatedAt.toISOString(),
          }));

        return toolOk({ items });
      });
    },
    {
      name: 'get_my_items',
      description:
        "List the current user's own ideas and problems (drafts and published), newest first.",
      schema: z.object({
        type: z.enum(['idea', 'problem', 'any']).default('any'),
        status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
      }),
    },
  );
}
