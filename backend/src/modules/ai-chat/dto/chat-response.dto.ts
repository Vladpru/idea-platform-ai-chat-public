export interface ChatSource {
  title: string;
  relevance: number;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponseDto {
  answer: string;
  sources: ChatSource[];
  history: ChatHistoryMessage[];
}
