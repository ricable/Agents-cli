/**
 * Unified pipeline orchestrator.
 *
 * Routes sources to the correct adapter based on prefix:
 * - pypi:, npm:, crates:, @scope/, owner/repo, ./path → RegistryAdapter
 * - mcp: → MCP2CLI adapter (future)
 * - cli-anything: → CLI-Anything adapter (future)
 *
 * Integrates with crawl queue for batch processing.
 */

import type { SourceAdapter, SkillCandidate, AdapterOptions } from "./types.js";
import { RegistryAdapter } from "./registry-adapter.js";
import { CliAnythingAdapter } from "./cli-anything-adapter.js";
import { Mcp2cliAdapter } from "./mcp2cli-adapter.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface PipelineOptions extends AdapterOptions {
  /** Additional adapters to register */
  adapters?: SourceAdapter[];
}

// ── Pipeline ───────────────────────────────────────────────────────────

export class UnifiedPipeline {
  private adapters: SourceAdapter[];

  constructor(opts?: PipelineOptions) {
    // Default adapters — order matters: more specific prefixes first
    this.adapters = [
      new CliAnythingAdapter(),
      new Mcp2cliAdapter(),
      new RegistryAdapter(),
      ...(opts?.adapters ?? []),
    ];
  }

  /**
   * Register an additional adapter.
   */
  register(adapter: SourceAdapter): void {
    this.adapters.push(adapter);
  }

  /**
   * Process a source through the appropriate adapter.
   */
  async process(source: string, opts?: AdapterOptions): Promise<SkillCandidate> {
    const adapter = this.findAdapter(source);
    if (!adapter) {
      throw new Error(`No adapter found for source: ${source}`);
    }
    return adapter.analyze(source, opts);
  }

  /**
   * Process multiple sources in batch.
   */
  async processBatch(
    sources: string[],
    opts?: AdapterOptions & { onProgress?: (done: number, total: number) => void },
  ): Promise<SkillCandidate[]> {
    const results: SkillCandidate[] = [];

    for (let i = 0; i < sources.length; i++) {
      try {
        const result = await this.process(sources[i]!, opts);
        results.push(result);
      } catch {
        results.push({
          source: sources[i]!,
          adapter: "registry",
        });
      }
      opts?.onProgress?.(i + 1, sources.length);
    }

    return results;
  }

  /**
   * Find the adapter that supports a given source.
   */
  private findAdapter(source: string): SourceAdapter | undefined {
    return this.adapters.find((a) => a.supports(source));
  }

  /**
   * List registered adapter types.
   */
  listAdapters(): string[] {
    return this.adapters.map((a) => a.type);
  }
}

/**
 * Create a unified pipeline with default adapters.
 */
export function createPipeline(opts?: PipelineOptions): UnifiedPipeline {
  return new UnifiedPipeline(opts);
}
