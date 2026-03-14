/**
 * Batch embedding generator for skill descriptions.
 *
 * Extracts and scales the existing embedViaOllama() from lib/search.ts
 * for bulk processing. Supports batch embedding of all skills in the
 * unified SQLite store.
 */

import { validateOllamaUrl } from "../guards.js";
import type { VecStore } from "../db/vec-store.js";
import type { UnifiedStore, SkillRecord } from "../db/unified-store.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface EmbeddingConfig {
  /** Ollama URL (default: http://127.0.0.1:11434) */
  ollamaUrl?: string;
  /** Embedding model (default: nomic-embed-text) */
  model?: string;
  /** Batch size for processing (default: 50) */
  batchSize?: number;
  /** Progress callback */
  onProgress?: (done: number, total: number) => void;
}

export interface EmbedResult {
  embedded: number;
  skipped: number;
  failed: number;
  durationMs: number;
}

// ── Constants ──────────────────────────────────────────────────────────

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const DEFAULT_MODEL = "nomic-embed-text";

// ── Embedding functions ────────────────────────────────────────────────

/**
 * Embed a single text string via Ollama.
 */
export async function embedText(text: string, config?: EmbeddingConfig): Promise<Float32Array> {
  const url = config?.ollamaUrl ?? OLLAMA_URL;
  const model = config?.model ?? DEFAULT_MODEL;

  validateOllamaUrl(url);

  const response = await fetch(`${url}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Ollama embed error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as { embeddings: number[][] };
  if (!result.embeddings?.[0]) {
    throw new Error("No embedding returned from Ollama");
  }

  return new Float32Array(result.embeddings[0]);
}

/**
 * Embed multiple texts in batch.
 * Uses Ollama's batch /api/embed endpoint for efficiency,
 * with one-by-one fallback per batch on failure.
 */
export async function embedBatch(
  texts: Array<{ id: string; text: string }>,
  config?: EmbeddingConfig,
): Promise<Array<{ id: string; embedding: Float32Array }>> {
  const results: Array<{ id: string; embedding: Float32Array }> = [];
  const batchSize = config?.batchSize ?? 50;
  const url = config?.ollamaUrl ?? OLLAMA_URL;
  const model = config?.model ?? DEFAULT_MODEL;

  validateOllamaUrl(url);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    try {
      const response = await fetch(`${url}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: batch.map(b => b.text) }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new Error(`Ollama embed error: ${response.status}`);
      const result = await response.json() as { embeddings: number[][] };
      for (let j = 0; j < batch.length && j < (result.embeddings?.length ?? 0); j++) {
        results.push({ id: batch[j]!.id, embedding: new Float32Array(result.embeddings[j]!) });
      }
    } catch {
      // Fallback: try one-by-one for this batch
      for (const item of batch) {
        try {
          const embedding = await embedText(item.text, config);
          results.push({ id: item.id, embedding });
        } catch { /* skip */ }
      }
    }
    config?.onProgress?.(Math.min(i + batchSize, texts.length), texts.length);
  }

  return results;
}

/**
 * Build the embedding text for a skill.
 * Concatenates name + domain + description + first 500 chars of body.
 */
export function buildEmbeddingText(skill: SkillRecord): string {
  const parts = [
    skill.name,
    skill.domain,
    skill.description,
  ];

  return parts.filter(Boolean).join(" ").slice(0, 1000);
}

/**
 * Embed all skills in the unified store and save to vec store.
 */
export async function embedAllSkills(
  store: UnifiedStore,
  vecStore: VecStore,
  config?: EmbeddingConfig,
): Promise<EmbedResult> {
  const start = Date.now();
  const skills = store.listSkills({ limit: 100_000 });

  // Filter out already-embedded skills
  const toEmbed = skills.filter((s) => !vecStore.has(s.id));

  if (toEmbed.length === 0) {
    return { embedded: 0, skipped: skills.length, failed: 0, durationMs: Date.now() - start };
  }

  // Build texts
  const texts = toEmbed.map((s) => ({
    id: s.id,
    text: buildEmbeddingText(s),
  }));

  // Embed in batch
  const embeddings = await embedBatch(texts, config);

  // Save to vec store
  if (embeddings.length > 0) {
    vecStore.bulkUpsert(embeddings);
    vecStore.setMeta("model", config?.model ?? DEFAULT_MODEL);
    vecStore.setMeta("lastEmbeddedAt", new Date().toISOString());
  }

  return {
    embedded: embeddings.length,
    skipped: skills.length - toEmbed.length,
    failed: toEmbed.length - embeddings.length,
    durationMs: Date.now() - start,
  };
}

