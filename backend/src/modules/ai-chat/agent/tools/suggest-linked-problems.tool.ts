import { tool } from '@langchain/core/tools';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import { getRunContext } from '../chat.types';
import { safeTool, toolError, toolOk } from './tool-utils';
import { visibleProblemWhere } from './visibility';

const logger = new Logger('SuggestLinkedProblemsTool');

export function createSuggestLinkedProblemsTool(
  prisma: Pick<PrismaService, 'problem'>,
) {
  return tool(
    async ({ problemIds }, config) => {
      const context = getRunContext(config);
      const pageContext = context.pageContext;
      if (pageContext?.type !== 'idea_form') {
        return toolError(
          'suggest_linked_problems is only available while editing an idea',
        );
      }
      return safeTool('suggest_linked_problems', logger, async () => {
        const alreadyLinked = new Set(pageContext.linkedProblemIds ?? []);
        const requested = [...new Set(problemIds)];
        const candidates = requested.filter(id => !alreadyLinked.has(id));
        const visible = candidates.length
          ? await prisma.problem.findMany({
              where: {
                id: { in: candidates },
                ...visibleProblemWhere(context.userId),
              },
              select: { id: true },
            })
          : [];
        const visibleIds = new Set(visible.map(p => p.id));
        const kept = candidates.filter(id => visibleIds.has(id));
        const dropped = requested.filter(id => !kept.includes(id));

        if (kept.length === 0) {
          return toolOk({
            kept,
            dropped,
            note: 'No valid problem IDs. Use search_ideas_problems with type "problem" first and pass IDs from its results.',
          });
        }
        context.emit({
          type: 'field_action',
          field: 'linked_problems',
          values: kept,
        });
        return toolOk({
          kept,
          dropped,
          note: 'The suggestions are shown to the user to apply.',
        });
      });
    },
    {
      name: 'suggest_linked_problems',
      description:
        'Suggest existing problems to link to the idea the user is editing. Pass only problem IDs returned by search_ideas_problems.',
      schema: z.object({
        problemIds: z.array(z.string().min(1).max(64)).min(1).max(10),
      }),
    },
  );
}
