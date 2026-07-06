export type ChatSession = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageSource = {
  title: string;
  relevance: number;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatMessageSource[];
  createdAt: string;
  pending?: boolean;
  streaming?: boolean;
};

export type ChatIntent =
  | 'search'
  | 'explain'
  | 'compare'
  | 'summarize'
  | 'navigate'
  | 'create_idea'
  | 'create_problem'
  | 'general';

export type ChatActionPayload =
  | { type: 'create_idea'; title?: string; description?: string; tags?: string[] }
  | { type: 'create_problem'; title?: string; description?: string };

export type KbStats = {
  totalChunks: number;
  ideaChunks: number;
  problemChunks: number;
  vaultChunks: number;
  lastSyncedAt: string | null;
  embeddingCoveragePercent: number;
};

export type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string; detail?: string }
  | { type: 'intent'; intent: ChatIntent; entityHint: string | null }
  | { type: 'suggestions'; suggestions: string[] }
  | { type: 'field_action'; field: 'tags' | 'linked_problems'; values: string[] };

export type { PageContext } from '@/shared/model/page-context-store';

export type NudgeItem = {
  type: 'idea' | 'problem';
  id: string;
  title: string;
  reason: 'stale_draft' | 'stage_stagnation';
  daysSinceUpdate: number;
  stage?: string;
};

export type NudgeResponse = {
  items: NudgeItem[];
};
