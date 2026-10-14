import type { ChatSource } from './chat.types';

export class SourceCollector {
  private readonly items = new Map<string, ChatSource>();

  add(sources: ChatSource[]): void {
    for (const source of sources) {
      const key = `${source.type}:${source.id ?? source.title}`;
      const existing = this.items.get(key);
      if (!existing || existing.relevance < source.relevance) {
        this.items.set(key, source);
      }
    }
  }

  list(): ChatSource[] {
    return [...this.items.values()];
  }
}
