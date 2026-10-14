import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../core/prisma/prisma.service';
import { EntityVisibilityService } from '../../../entity-visibility/entity-visibility.service';
import { KnowledgeRetrievalService } from '../../../rag/knowledge-retrieval.service';
import type { ChatTools } from '../tool-registry';
import { createGetEntityTool } from './get-entity.tool';
import { createGetMyItemsTool } from './get-my-items.tool';
import { createProposeDraftTool } from './propose-draft.tool';
import { createSearchIdeasProblemsTool } from './search-ideas-problems.tool';
import { createSearchKnowledgeTool } from './search-knowledge.tool';
import { createSuggestLinkedProblemsTool } from './suggest-linked-problems.tool';
import { createSuggestTagsTool } from './suggest-tags.tool';

@Injectable()
export class ChatToolsProvider {
  readonly tools: ChatTools;

  constructor(
    prisma: PrismaService,
    retrieval: KnowledgeRetrievalService,
    visibility: EntityVisibilityService,
  ) {
    this.tools = {
      search_knowledge: createSearchKnowledgeTool(retrieval),
      search_ideas_problems: createSearchIdeasProblemsTool(prisma, retrieval),
      get_my_items: createGetMyItemsTool(prisma),
      get_entity: createGetEntityTool(prisma, visibility),
      propose_draft: createProposeDraftTool(),
      suggest_tags: createSuggestTagsTool(prisma),
      suggest_linked_problems: createSuggestLinkedProblemsTool(prisma),
    };
  }
}
