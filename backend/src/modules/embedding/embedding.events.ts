export const EMBEDDING_EVENTS = {
  SYNCED: 'embedding.synced',
} as const;

export type EmbeddingSyncedEvent = {
  entityType: 'idea' | 'problem';
  entityId: string;
  vectorLiteral: string;
};
