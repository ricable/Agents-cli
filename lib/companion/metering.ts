/**
 * companion/metering.ts — In-memory daily usage metering per API key.
 */

interface UsageBucket {
  count: number;
  resetAt: number;  // epoch ms when counter resets
}

const ONE_DAY_MS = 86_400_000;

/**
 * In-memory usage tracker. Tracks daily generation count per API key hash.
 */
export class UsageMeter {
  private readonly buckets = new Map<string, UsageBucket>();

  /**
   * Record a usage event. Returns true if within limit, false if exceeded.
   */
  recordUsage(keyHash: string, dailyLimit: number): boolean {
    if (dailyLimit < 0) return true; // unlimited

    const now = Date.now();
    let bucket = this.buckets.get(keyHash);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + ONE_DAY_MS };
      this.buckets.set(keyHash, bucket);
    }

    if (bucket.count >= dailyLimit) return false;

    bucket.count++;
    return true;
  }

  /**
   * Get current usage for a key hash.
   */
  getUsage(keyHash: string): { count: number; resetAt: number } {
    const now = Date.now();
    const bucket = this.buckets.get(keyHash);
    if (!bucket || now >= bucket.resetAt) {
      return { count: 0, resetAt: now + ONE_DAY_MS };
    }
    return { count: bucket.count, resetAt: bucket.resetAt };
  }

  /**
   * Sweep expired buckets to prevent memory growth.
   */
  sweep(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) this.buckets.delete(key);
    }
  }
}
