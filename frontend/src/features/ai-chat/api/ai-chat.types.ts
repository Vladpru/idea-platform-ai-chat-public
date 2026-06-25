export type ChatSession = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  pending?: boolean;
  streaming?: boolean;
};

export type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string };
