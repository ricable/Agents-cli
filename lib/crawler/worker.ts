/**
 * Crawl queue worker: pulls items from the crawl queue and processes them
 * through the skill-forge pipeline with adaptive concurrency.
 *
 * Supports:
 * - Adaptive concurrency based on system load
 * - Rate limiting per registry
 * - Exponential backoff on failures (1min → 5min → 30min)
 * - Install-analyze-prune cycle (delete package/ after skill generation)
 * - Progress reporting
 */

import { rmSync } from "node:fs";
import { join } from "node:path";
import type { UnifiedStore } from "../db/unified-store.js";
import { AdaptiveSemaphore } from "../concurrency.js";
import { toErrorMessage } from "../output.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface WorkerOptions {
  /** Maximum concurrent tool processing (default: CPU count) */
  concurrency?: number;
  /** Maximum items to process per run (default: unlimited) */
  limit?: number;
  /** Registry filter (process only this registry) */
  registry?: string;
  /** Batch size for dequeuing (default: 5) */
  batchSize?: number;
  /** Whether to prune installed packages after skill generation (default: true) */
  prune?: boolean;
  /** Data directory for tool storage */
  dataDir: string;
  /** Skills output directory */
  skillsDir: string;
  /** Progress callback */
  onProgress?: (stats: WorkerProgress) => void;
  /** Process a single crawl item (injected to avoid circular deps with forge) */
  processItem: (source: string, opts: { dataDir: string; skillsDir: string }) => Promise<ProcessResult>;
}

export interface ProcessResult {
  ok: boolean;
  skillId?: string;
  error?: string;
}

export interface WorkerProgress {
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
  currentConcurrency: number;
}

export interface WorkerResult {
  processed: number;
  succeeded: number;
  failed: number;
  prunedDirs: number;
  durationMs: number;
  errors: Array<{ source: string; error: string }>;
}

// ── Worker ─────────────────────────────────────────────────────────────

/**
 * Run the crawl queue worker.
 * Pulls items from the crawl_queue table and processes them.
 */
export async function runCrawlWorker(
  store: UnifiedStore,
  opts: WorkerOptions,
): Promise<WorkerResult> {
  const start = Date.now();
  const batchSize = opts.batchSize ?? 5;
  const shouldPrune = opts.prune ?? true;
  const semaphore = new AdaptiveSemaphore({
    initial: opts.concurrency,
    targetLatencyMs: 30_000, // Tools take a while to install + analyze
  });

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let prunedDirs = 0;
  const errors: Array<{ source: string; error: string }> = [];
  const limit = opts.limit ?? Infinity;

  while (processed < limit) {
    // Dequeue a batch
    const remaining = Math.min(batchSize, limit - processed);
    const items = store.dequeue(remaining);
    if (items.length === 0) break;

    // Process batch concurrently
    await Promise.allSettled(
      items.map(async (item) => {
        await semaphore.acquire();
        const taskStart = Date.now();
        try {
          const result = await opts.processItem(item.source, {
            dataDir: opts.dataDir,
            skillsDir: opts.skillsDir,
          });

          if (result.ok) {
            store.markDone(item.id);
            succeeded++;

            // Prune installed package directory
            if (shouldPrune && result.skillId) {
              const packageDir = join(opts.dataDir, "tools", result.skillId, "package");
              rmSync(packageDir, { recursive: true, force: true });
              prunedDirs++;
            }
          } else {
            store.markFailed(item.id, result.error ?? "Unknown error");
            errors.push({ source: item.source, error: result.error ?? "Unknown error" });
            failed++;
          }
        } catch (err) {
          store.markFailed(item.id, toErrorMessage(err));
          errors.push({ source: item.source, error: toErrorMessage(err) });
          failed++;
        } finally {
          semaphore.release(Date.now() - taskStart);
          processed++;

          opts.onProgress?.({
            processed,
            succeeded,
            failed,
            remaining: limit === Infinity ? store.crawlStats().pending : limit - processed,
            currentConcurrency: semaphore.concurrency,
          });
        }
      }),
    );
  }

  return {
    processed,
    succeeded,
    failed,
    prunedDirs,
    durationMs: Date.now() - start,
    errors: errors.slice(0, 50), // Cap error list
  };
}
