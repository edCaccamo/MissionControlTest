// In-memory TTL cache. Avoids redundant NASA API calls for repeated queries.
// Would be swapped for Redis in a multi-instance setup.

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTtl: number;

  constructor(ttlSeconds: number = 300) {
    this.defaultTtl = ttlSeconds * 1000; // convert to milliseconds
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTtl / 1000) * 1000;
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

import { config } from "../config";
export const appCache = new Cache(config.cache.ttl);
