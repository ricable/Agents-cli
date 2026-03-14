/**
 * Adaptive concurrency primitives for batch processing.
 *
 * - AdaptiveSemaphore: auto-adjusts concurrency based on system load
 * - TokenBucketRateLimiter: configurable rate limiting for API calls
 * - mapConcurrent: concurrent map with semaphore + rate limiter
 */

import { cpus } from "node:os";
import { toErrorMessage } from "./output.js";

// ── AdaptiveSemaphore ──────────────────────────────────────────────────

export interface AdaptiveSemaphoreOptions {
  /** Initial concurrency (default: CPU count) */
  initial?: number;
  /** Minimum concurrency (default: 1) */
  min?: number;
  /** Maximum concurrency (default: CPU count * 2) */
  max?: number;
  /** Target latency in ms — ramp down if exceeded (default: 5000) */
  targetLatencyMs?: number;
  /** Check interval in completed tasks (default: 10) */
  checkInterval?: number;
}

export class AdaptiveSemaphore {
  private current: number;
  private readonly min: number;
  private readonly max: number;
  private readonly targetLatencyMs: number;
  private readonly checkInterval: number;
  private active = 0;
  private completedSinceCheck = 0;
  private totalLatencyMs = 0;
  private waiting: Array<() => void> = [];

  constructor(opts?: AdaptiveSemaphoreOptions) {
    const cpuCount = cpus().length;
    this.current = opts?.initial ?? cpuCount;
    this.min = opts?.min ?? 1;
    this.max = opts?.max ?? cpuCount * 2;
    this.targetLatencyMs = opts?.targetLatencyMs ?? 5000;
    this.checkInterval = opts?.checkInterval ?? 10;
  }

  /** Current concurrency level */
  get concurrency(): number {
    return this.current;
  }

  /** Number of currently active tasks */
  get activeCount(): number {
    return this.active;
  }

  /** Number of tasks waiting for a slot */
  get waitingCount(): number {
    return this.waiting.length;
  }

  /** Acquire a semaphore slot */
  async acquire(): Promise<void> {
    if (this.active < this.current) {
      this.active++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  /** Release a semaphore slot, reporting task latency for adaptation */
  release(latencyMs?: number): void {
    this.active--;

    if (latencyMs !== undefined) {
      this.totalLatencyMs += latencyMs;
      this.completedSinceCheck++;

      if (this.completedSinceCheck >= this.checkInterval) {
        this.adapt();
      }
    }

    // Wake next waiter
    if (this.waiting.length > 0 && this.active < this.current) {
      const next = this.waiting.shift()!;
      next();
    }
  }

  /** Adapt concurrency based on observed latency */
  private adapt(): void {
    const avgLatency = this.totalLatencyMs / this.completedSinceCheck;
    this.totalLatencyMs = 0;
    this.completedSinceCheck = 0;

    if (avgLatency > this.targetLatencyMs * 1.5 && this.current > this.min) {
      // Too slow — ramp down
      this.current = Math.max(this.min, Math.floor(this.current * 0.75));
    } else if (avgLatency < this.targetLatencyMs * 0.5 && this.current < this.max) {
      // Fast — ramp up
      this.current = Math.min(this.max, this.current + 1);
      // Wake any waiters that can now proceed
      while (this.waiting.length > 0 && this.active < this.current) {
        const next = this.waiting.shift()!;
        next();
      }
    }
  }
}

// ── TokenBucketRateLimiter ─────────────────────────────────────────────

export interface RateLimiterOptions {
  /** Maximum tokens (requests) per interval */
  tokensPerInterval: number;
  /** Interval in milliseconds (default: 60_000 = 1 minute) */
  intervalMs?: number;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly intervalMs: number;
  private lastRefill: number;
  private waiting: Array<() => void> = [];
  private refillTimer: ReturnType<typeof setInterval> | null = null;

  constructor(opts: RateLimiterOptions) {
    this.maxTokens = opts.tokensPerInterval;
    this.tokens = this.maxTokens;
    this.intervalMs = opts.intervalMs ?? 60_000;
    this.lastRefill = Date.now();

    // Periodic refill
    this.refillTimer = setInterval(() => this.refill(), this.intervalMs);
    // Don't block process exit
    if (this.refillTimer.unref) this.refillTimer.unref();
  }

  /** Wait for a token (rate-limited slot) */
  async acquire(): Promise<void> {
    this.tryRefill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(() => {
        this.tokens--;
        resolve();
      });
    });
  }

  /** Refill tokens and wake waiters */
  private refill(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();

    while (this.waiting.length > 0 && this.tokens > 0) {
      const next = this.waiting.shift()!;
      next();
    }
  }

  /** Partial refill based on elapsed time */
  private tryRefill(): void {
    const elapsed = Date.now() - this.lastRefill;
    if (elapsed >= this.intervalMs) {
      this.refill();
    }
  }

  /** Stop the refill timer */
  destroy(): void {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }
    // Wake all waiters
    for (const waiter of this.waiting) waiter();
    this.waiting = [];
  }

  /** Current available tokens */
  get available(): number {
    this.tryRefill();
    return this.tokens;
  }
}

// ── mapConcurrent ──────────────────────────────────────────────────────

export interface MapConcurrentOptions {
  /** Semaphore to use (creates a new one if not provided) */
  semaphore?: AdaptiveSemaphore;
  /** Rate limiter to use (no rate limiting if not provided) */
  rateLimiter?: TokenBucketRateLimiter;
  /** Called for each item processed */
  onProgress?: (completed: number, total: number, item: unknown) => void;
}

/**
 * Map over items with adaptive concurrency and optional rate limiting.
 * Replaces simple Promise.all with back-pressure and adaptation.
 */
export async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  opts?: MapConcurrentOptions,
): Promise<Array<{ ok: true; value: R } | { ok: false; error: string }>> {
  const sem = opts?.semaphore ?? new AdaptiveSemaphore();
  const rl = opts?.rateLimiter;
  let completed = 0;

  const results = await Promise.all(
    items.map(async (item, idx) => {
      await sem.acquire();
      if (rl) await rl.acquire();

      const start = Date.now();
      try {
        const value = await fn(item, idx);
        completed++;
        opts?.onProgress?.(completed, items.length, item);
        return { ok: true as const, value };
      } catch (err) {
        completed++;
        opts?.onProgress?.(completed, items.length, item);
        return { ok: false as const, error: toErrorMessage(err) };
      } finally {
        sem.release(Date.now() - start);
      }
    }),
  );

  return results;
}

/**
 * Auto-detect reasonable concurrency for the current machine.
 */
export function detectConcurrency(): number {
  return cpus().length;
}
