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
  | 'general';

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
  | { type: 'suggestions'; suggestions: string[] };
