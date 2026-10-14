import type { RunnableConfig } from '@langchain/core/runnables';

import type { SourceCollector } from './source-collector';

export const CHAT_INTENTS = [
  'search',
  'explain',
  'compare',
  'summarize',
  'navigate',
  'create_idea',
  'create_problem',
  'general',
] as const;

export type ChatIntent = (typeof CHAT_INTENTS)[number];

export type ChatUserRole = 'ADMIN' | 'MEMBER';

export interface ChatPageContext {
  type: 'idea_form' | 'problem_form';
  title?: string;
  description?: string;
  tags?: string[];
  linkedProblemIds?: string[];
}

export interface ChatSource {
  type: 'idea' | 'problem' | 'knowledge';
  id?: string;
  title: string;
  relevance: number;
}

export type ChatSideEvent =
  | { type: 'intent'; intent: ChatIntent; entityHint: string | null }
  | {
      type: 'field_action';
      field: 'tags' | 'linked_problems';
      values: string[];
    }
  | {
      type: 'draft_proposal';
      draftType: 'idea' | 'problem';
      title: string;
      description: string;
      tags: string[];
    };

export interface ChatRunContext {
  sessionId: string;
  userId: string;
  role: ChatUserRole;
  pageContext: ChatPageContext | null;
  emit: (event: ChatSideEvent) => void;
  sources: SourceCollector;
}

export const CHAT_CONTEXT_KEY = 'chat';

export function getRunContext(config?: RunnableConfig): ChatRunContext {
  const context = config?.configurable?.[CHAT_CONTEXT_KEY] as
    | ChatRunContext
    | undefined;
  if (!context) {
    throw new Error('Chat run context is missing from config.configurable');
  }
  return context;
}
