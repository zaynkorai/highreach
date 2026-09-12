import type { TenantKnowledgeContext } from "./types.ts";

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

/**
 * Lightweight, zero-dependency in-memory TTL cache.
 * Designed to prevent repetitive database roundtrips for static tenant identity & operating hours.
 */
export class MemoryCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private defaultTtlMs: number;

    constructor(defaultTtlSeconds: number = 300) {
        this.defaultTtlMs = defaultTtlSeconds * 1000;
    }

    /**
     * Retrieve an item if present and not expired.
     */
    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    /**
     * Store an item with an expiration timestamp.
     */
    set(key: string, value: T, ttlSeconds?: number): void {
        const ttlMs = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtlMs;
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    }

    /**
     * Explicitly invalidate a cache entry (e.g. on tenant settings or knowledge source edit).
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Flush all items in the cache.
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Active count of non-expired cached entries.
     */
    size(): number {
        const now = Date.now();
        let count = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            } else {
                count++;
            }
        }
        return count;
    }
}

/**
 * Global cache instance for Tenant Knowledge (Identity, Operating Hours, Default Facts).
 * Default TTL: 5 minutes (300 seconds).
 */
export const tenantKnowledgeCache = new MemoryCache<TenantKnowledgeContext>(300);

/**
 * Invalidate cached knowledge for a specific tenant when their data is updated.
 */
export function invalidateTenantKnowledgeCache(tenantId: string): boolean {
    return tenantKnowledgeCache.delete(tenantId);
}
