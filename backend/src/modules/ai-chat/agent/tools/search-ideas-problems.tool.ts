import { tool } from '@langchain/core/tools';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import type { KnowledgeRetrievalService } from '../../../rag/knowledge-retrieval.service';
import { getRunContext } from '../chat.types';
import { chunkToSource } from './search-knowledge.tool';
import { safeTool, toolOk, truncate } from './tool-utils';
import { visibleIdeaWhere, visibleProblemWhere } from './visibility';

const logger = new Logger('SearchIdeasProblemsTool');

const SUMMARY_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  stage: true,
  tags: { select: { tag: { select: { name: true } } } },
} as const;

type EntityRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  stage: string | null;
  tags: { tag: { name: string } }[];
};

export function createSearchIdeasProblemsTool(
  prisma: Pick<PrismaService, 'idea' | 'problem'>,
  retrieval: Pick<KnowledgeRetrievalService, 'retrieve'>,
) {
  return tool(
    async ({ query, type, limit }, config) => {
      const context = getRunContext(config);
      return safeTool('search_ideas_problems', logger, async () => {
        const chunks = await retrieval.retrieve(query, {
          userId: context.userId,
          role: context.role,
          topK: limit * 2,
          scope: 'entities',
        });
        const refs = chunks
          .map(chunkToSource)
          .filter(
            ref =>
              ref.id &&
              ref.type !== 'knowledge' &&
              (type === 'any' || ref.type === type),
          );
        const ideaIds = refs.filter(r => r.type === 'idea').map(r => r.id!);
        const problemIds = refs
          .filter(r => r.type === 'problem')
          .map(r => r.id!);

        const [ideas, problems] = await Promise.all([
          ideaIds.length
            ? prisma.idea.findMany({
                where: {
                  id: { in: ideaIds },
                  ...visibleIdeaWhere(context.userId),
                },
                select: SUMMARY_SELECT,
              })
            : Promise.resolve([]),
          problemIds.length
            ? prisma.problem.findMany({
                where: {
                  id: { in: problemIds },
                  ...visibleProblemWhere(context.userId),
                },
                select: SUMMARY_SELECT,
              })
            : Promise.resolve([]),
        ]);

        const rowsByKey = new Map<string, EntityRow>();
        for (const row of ideas as EntityRow[])
          rowsByKey.set(`idea:${row.id}`, row);
        for (const row of problems as EntityRow[])
          rowsByKey.set(`problem:${row.id}`, row);

        const results = refs
          .filter(ref => rowsByKey.has(`${ref.type}:${ref.id}`))
          .slice(0, limit)
          .map(ref => {
            const row = rowsByKey.get(`${ref.type}:${ref.id}`)!;
            return {
              ref,
              item: {
                id: row.id,
                type: ref.type,
                title: row.title ?? 'Untitled',
                status: row.status,
                stage: row.stage,
                tags: row.tags.map(t => t.tag.name),
                description: truncate(row.description),
              },
            };
          });

        context.sources.add(
          results.map(({ ref, item }) => ({
            type: ref.type,
            id: item.id,
            title: item.title,
            relevance: ref.relevance,
          })),
        );

        if (results.length === 0) {
          return toolOk({
            results: [],
            note: 'No matching ideas or problems found',
          });
        }
        return toolOk({ results: results.map(r => r.item) });
      });
    },
    {
      name: 'search_ideas_problems',
      description:
        'Find ideas and/or problems on the platform by topic, keyword or description. Returns IDs, titles, status, stage, tags and a short description. Use the returned IDs with get_entity or suggest_linked_problems.',
      schema: z.object({
        query: z.string().min(1).max(200).describe('Standalone search query'),
        type: z.enum(['idea', 'problem', 'any']).default('any'),
        limit: z.number().int().min(1).max(8).default(5),
      }),
    },
  );
}
