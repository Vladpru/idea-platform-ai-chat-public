import { tool } from '@langchain/core/tools';
import { Logger, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import type { EntityVisibilityService } from '../../../entity-visibility/entity-visibility.service';
import { getRunContext } from '../chat.types';
import { safeTool, toolError, toolOk, truncate } from './tool-utils';

const DETAIL_DESCRIPTION_LIMIT = 2000;
const logger = new Logger('GetEntityTool');

type Prisma = Pick<PrismaService, 'idea' | 'problem'>;

function authorName(
  author: { firstName: string | null; lastName: string | null } | null,
): string | null {
  if (!author) return null;
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ');
  return name || null;
}

async function loadIdea(prisma: Prisma, id: string) {
  const idea = await prisma.idea.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      stage: true,
      author: { select: { firstName: true, lastName: true } },
      tags: { select: { tag: { select: { name: true } } } },
      _count: { select: { problems: true } },
    },
  });
  if (!idea) return null;
  return {
    type: 'idea' as const,
    id: idea.id,
    title: idea.title ?? 'Untitled',
    description: truncate(idea.description, DETAIL_DESCRIPTION_LIMIT),
    status: idea.status,
    stage: idea.stage,
    author: authorName(idea.author),
    tags: idea.tags.map(t => t.tag.name),
    linkedProblemsCount: idea._count.problems,
  };
}

async function loadProblem(prisma: Prisma, id: string) {
  const problem = await prisma.problem.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      stage: true,
      valueProposition: true,
      category: true,
      impact: true,
      author: { select: { firstName: true, lastName: true } },
      tags: { select: { tag: { select: { name: true } } } },
      _count: { select: { ideas: true } },
    },
  });
  if (!problem) return null;
  return {
    type: 'problem' as const,
    id: problem.id,
    title: problem.title,
    description: truncate(problem.description, DETAIL_DESCRIPTION_LIMIT),
    status: problem.status,
    stage: problem.stage,
    valueProposition: problem.valueProposition,
    category: problem.category,
    impact: problem.impact,
    author: authorName(problem.author),
    tags: problem.tags.map(t => t.tag.name),
    linkedIdeasCount: problem._count.ideas,
  };
}

export function createGetEntityTool(
  prisma: Prisma,
  visibility: Pick<
    EntityVisibilityService,
    'getVisibleIdea' | 'getVisibleProblem'
  >,
) {
  return tool(
    async ({ type, id }, config) => {
      const context = getRunContext(config);
      return safeTool('get_entity', logger, async () => {
        try {
          if (type === 'idea') {
            await visibility.getVisibleIdea(id, context.userId);
          } else {
            await visibility.getVisibleProblem(id, context.userId);
          }
        } catch (error) {
          if (error instanceof NotFoundException) return toolError('not found');
          throw error;
        }

        const details =
          type === 'idea'
            ? await loadIdea(prisma, id)
            : await loadProblem(prisma, id);
        if (!details) return toolError('not found');

        context.sources.add([{ type, id, title: details.title, relevance: 1 }]);
        return toolOk(details);
      });
    },
    {
      name: 'get_entity',
      description:
        'Get full details of one idea or problem by its ID. Only use IDs returned by other tools or shown in the conversation.',
      schema: z.object({
        type: z.enum(['idea', 'problem']),
        id: z.string().min(1).max(64),
      }),
    },
  );
}
