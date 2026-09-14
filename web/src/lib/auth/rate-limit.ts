/**
 * In-memory sliding-window rate limiter for authentication endpoints.
 * Provides zero-dependency, ultra-fast protection against brute-force attacks.
 */

interface RateLimitRecord {
    timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale entries to prevent memory leaks (every 10 minutes)
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of rateLimitStore.entries()) {
            record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000); // 1 hour max window
            if (record.timestamps.length === 0) {
                rateLimitStore.delete(key);
            }
        }
    }, 10 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

/**
 * Check if an action is allowed under the given rate limit parameters.
 *
 * @param key Unique identifier (e.g., "login:email@example.com" or "login:ip_address")
 * @param maxAttempts Maximum allowed attempts within the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
    key: string,
    maxAttempts: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    const record = rateLimitStore.get(key) ?? { timestamps: [] };

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxAttempts) {
        const oldestTimestamp = record.timestamps[0];
        const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds,
        };
    }

    // Record the current attempt
    record.timestamps.push(now);
    rateLimitStore.set(key, record);

    return {
        allowed: true,
        remaining: maxAttempts - record.timestamps.length,
        retryAfterSeconds: 0,
    };
}

/**
 * Reset rate limit tracking for a given key (e.g., after successful login).
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

/**
 * Check login attempt limit: 5 attempts per 15 minutes.
 */
export function checkLoginRateLimit(identifier: string): RateLimitResult {
    return checkRateLimit(`login:${identifier.toLowerCase().trim()}`, 5, 15 * 60 * 1000);
}

/**
 * Check signup attempt limit: 5 signups per hour.
 */
export function checkSignupRateLimit(identifier: string): RateLimitResult {
    return checkRateLimit(`signup:${identifier.toLowerCase().trim()}`, 5, 60 * 60 * 1000);
}

/**
 * Check password reset attempt limit: 3 requests per 15 minutes.
 */
export function checkPasswordResetRateLimit(identifier: string): RateLimitResult {
    return checkRateLimit(`pwd-reset:${identifier.toLowerCase().trim()}`, 3, 15 * 60 * 1000);
}
