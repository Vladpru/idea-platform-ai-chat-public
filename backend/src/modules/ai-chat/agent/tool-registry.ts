import type { StructuredToolInterface } from '@langchain/core/tools';

import type { ChatIntent, ChatPageContext } from './chat.types';

export const CHAT_TOOL_NAMES = [
  'search_knowledge',
  'search_ideas_problems',
  'get_my_items',
  'get_entity',
  'propose_draft',
  'suggest_tags',
  'suggest_linked_problems',
] as const;

export type ChatToolName = (typeof CHAT_TOOL_NAMES)[number];

export type ChatTools = Record<ChatToolName, StructuredToolInterface>;

const INTENT_TOOLS: Record<ChatIntent, ChatToolName[]> = {
  search: ['search_ideas_problems', 'search_knowledge', 'get_entity'],
  explain: ['get_entity', 'search_ideas_problems', 'search_knowledge'],
  compare: ['get_entity', 'search_ideas_problems', 'search_knowledge'],
  summarize: ['get_my_items', 'search_ideas_problems', 'search_knowledge'],
  navigate: ['search_knowledge'],
  create_idea: ['propose_draft'],
  create_problem: ['propose_draft'],
  general: ['search_knowledge', 'get_my_items'],
};

const IDEA_FORM_TOOLS: ChatToolName[] = [
  'suggest_tags',
  'suggest_linked_problems',
  'search_ideas_problems',
];

export function selectToolNames(
  intent: ChatIntent,
  pageContext: ChatPageContext | null,
): ChatToolName[] {
  const names = [...(INTENT_TOOLS[intent] ?? INTENT_TOOLS.general)];
  if (pageContext?.type === 'idea_form') {
    names.push(...IDEA_FORM_TOOLS);
  }
  return [...new Set(names)];
}

export function selectTools(
  tools: ChatTools,
  names: ChatToolName[],
): StructuredToolInterface[] {
  return names.map(name => tools[name]);
}
