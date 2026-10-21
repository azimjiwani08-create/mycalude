/**
 * Sliding-window limiter, per key. In-memory, so each serverless instance
 * counts separately — good enough to stop bursts. For a hard global limit,
 * back this with Upstash Redis or Vercel KV using the same interface.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfterS: number } {
  const hits = (buckets.get(key) ?? []).filter((t) => t > now - windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterS: Math.ceil((hits[0] + windowMs - now) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 50_000) buckets.clear(); // memory guard
  return { ok: true, retryAfterS: 0 };
}

export function resetRateLimits() {
  buckets.clear();
}
