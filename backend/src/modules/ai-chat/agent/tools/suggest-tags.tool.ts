import { tool } from '@langchain/core/tools';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import { getRunContext } from '../chat.types';
import { normalizeTags, safeTool, toolError, toolOk } from './tool-utils';

const MAX_SUGGESTED_TAGS = 5;
const logger = new Logger('SuggestTagsTool');

export function createSuggestTagsTool(prisma: Pick<PrismaService, 'tag'>) {
  return tool(
    async ({ tags }, config) => {
      const context = getRunContext(config);
      const pageContext = context.pageContext;
      if (pageContext?.type !== 'idea_form') {
        return toolError(
          'suggest_tags is only available while editing an idea',
        );
      }
      return safeTool('suggest_tags', logger, async () => {
        const onForm = new Set(
          (pageContext.tags ?? []).map(t => t.toLowerCase()),
        );
        const candidates = normalizeTags(tags, 10).filter(
          tag => !onForm.has(tag.toLowerCase()),
        );
        const known = candidates.length
          ? await prisma.tag.findMany({
              where: { name: { in: candidates, mode: 'insensitive' } },
              select: { name: true },
            })
          : [];
        const knownByLower = new Map(
          known.map(t => [t.name.toLowerCase(), t.name]),
        );
        const suggested = candidates
          .map(tag => knownByLower.get(tag.toLowerCase()) ?? tag)
          .slice(0, MAX_SUGGESTED_TAGS);

        if (suggested.length === 0) {
          return toolOk({
            suggested: [],
            note: 'All suggested tags are already on the form',
          });
        }
        context.emit({
          type: 'field_action',
          field: 'tags',
          values: suggested,
        });
        return toolOk({
          suggested,
          note: 'The suggestions are shown to the user to apply.',
        });
      });
    },
    {
      name: 'suggest_tags',
      description:
        'Suggest tags for the idea the user is editing. The user sees them as a card they can apply.',
      schema: z.object({
        tags: z.array(z.string().min(1).max(50)).min(1).max(10),
      }),
    },
  );
}
