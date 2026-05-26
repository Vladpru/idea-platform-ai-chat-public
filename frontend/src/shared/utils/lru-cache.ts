export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    if (maxSize < 1) throw new Error('LRUCache maxSize must be >= 1');
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value === undefined && !this.cache.has(key)) {
      return undefined;
    }

    this.cache.delete(key);
    this.cache.set(key, value as V);

    return value;
  }

  set(key: K, value: V): void {
    this.cache.delete(key);

    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}
