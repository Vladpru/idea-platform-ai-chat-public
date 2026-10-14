import { tool } from '@langchain/core/tools';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

import type {
  ChunkResult,
  KnowledgeRetrievalService,
} from '../../../rag/knowledge-retrieval.service';
import { type ChatSource, getRunContext } from '../chat.types';
import { safeTool, toolOk, truncate } from './tool-utils';

const KNOWLEDGE_TOP_K = 5;
const CHUNK_CONTENT_LIMIT = 1200;
const ENTITY_SOURCE = /^(idea|problem):(.+)$/;
const logger = new Logger('SearchKnowledgeTool');

export function chunkToSource(chunk: ChunkResult): ChatSource {
  const match = ENTITY_SOURCE.exec(chunk.source);
  if (match) {
    const title =
      typeof chunk.metadata.title === 'string' && chunk.metadata.title
        ? chunk.metadata.title
        : chunk.source;
    return {
      type: match[1] as 'idea' | 'problem',
      id: match[2],
      title,
      relevance: chunk.relevance,
    };
  }
  return { type: 'knowledge', title: chunk.source, relevance: chunk.relevance };
}

export function createSearchKnowledgeTool(
  retrieval: Pick<KnowledgeRetrievalService, 'retrieve'>,
) {
  return tool(
    async ({ query }, config) => {
      const context = getRunContext(config);
      return safeTool('search_knowledge', logger, async () => {
        const chunks = await retrieval.retrieve(query, {
          userId: context.userId,
          role: context.role,
          topK: KNOWLEDGE_TOP_K,
        });
        context.sources.add(chunks.map(chunkToSource));
        return toolOk({
          results: chunks.map((chunk, index) => ({
            n: index + 1,
            content: truncate(chunk.content, CHUNK_CONTENT_LIMIT),
          })),
        });
      });
    },
    {
      name: 'search_knowledge',
      description:
        'Search platform documentation and the text of ideas and problems. Use for questions about how the platform works, its features and concepts, or for broad topic questions.',
      schema: z.object({
        query: z
          .string()
          .min(1)
          .max(200)
          .describe(
            'Standalone search query. Resolve words like "it" or "that" from the conversation.',
          ),
      }),
    },
  );
}
