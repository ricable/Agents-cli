/**
 * Skill graph builder: pre-computes edges between skills.
 *
 * 4 edge types:
 * - io_chain: A outputs type X, B inputs type X
 * - same_domain: same domain + optional subdomain match
 * - embedding_similar: cosine similarity above threshold
 * - llm_inferred: LLM identifies creative cross-domain connections
 */

import type { UnifiedStore, SkillRecord, EdgeType } from "../db/unified-store.js";
import type { VecStore } from "../db/vec-store.js";
import { extractIOProfile, type IOProfile } from "./io-extractor.js";
import { cosine } from "../guards.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ── Types ──────────────────────────────────────────────────────────────

export interface GraphBuildOptions {
  /** Minimum cosine similarity for embedding edges (default: 0.6) */
  embeddingThreshold?: number;
  /** Whether to compute LLM-inferred edges (slow) */
  includeLLM?: boolean;
  /** Progress callback */
  onProgress?: (phase: string, done: number, total: number) => void;
}

export interface GraphBuildResult {
  ioChainEdges: number;
  sameDomainEdges: number;
  embeddingSimilarEdges: number;
  llmInferredEdges: number;
  totalEdges: number;
  durationMs: number;
}

// ── Graph builder ──────────────────────────────────────────────────────

/**
 * Build the full skill graph from all skills in the store.
 */
export async function buildSkillGraph(
  store: UnifiedStore,
  vecStore: VecStore | null,
  opts?: GraphBuildOptions,
): Promise<GraphBuildResult> {
  const start = Date.now();
  const threshold = opts?.embeddingThreshold ?? 0.6;
  const skills = store.listSkills({ limit: 100_000 });
  const total = skills.length;

  let ioChainEdges = 0;
  let sameDomainEdges = 0;
  let embeddingSimilarEdges = 0;
  let llmInferredEdges = 0;

  // 1. Extract IO profiles for all skills
  opts?.onProgress?.("io-extract", 0, total);
  const profiles = new Map<string, IOProfile>();
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i]!;
    const skillMd = loadSkillMd(skill);
    if (skillMd) {
      profiles.set(skill.id, extractIOProfile(skillMd));
    }
    if (i % 100 === 0) opts?.onProgress?.("io-extract", i, total);
  }
  opts?.onProgress?.("io-extract", total, total);

  // 2. Compute IO chain edges via inverted index (avoids O(n^2) full scan)
  opts?.onProgress?.("io-chain", 0, total);
  const ioEdges: Array<{ sourceId: string; targetId: string; edgeType: EdgeType; weight: number }> = [];

  // Build inverted index: IOType -> producer/consumer skill IDs
  const producersByType = new Map<string, string[]>();
  const consumersByType = new Map<string, string[]>();

  for (const [skillId, profile] of profiles) {
    for (const output of profile.outputs) {
      const list = producersByType.get(output.type) ?? [];
      list.push(skillId);
      producersByType.set(output.type, list);
    }
    for (const input of profile.inputs) {
      const list = consumersByType.get(input.type) ?? [];
      list.push(skillId);
      consumersByType.set(input.type, list);
    }
  }

  // Match producers to consumers via shared IO types
  for (const [ioType, producers] of producersByType) {
    const consumers = consumersByType.get(ioType) ?? [];
    for (const producerId of producers) {
      for (const consumerId of consumers) {
        if (producerId !== consumerId) {
          ioEdges.push({ sourceId: producerId, targetId: consumerId, edgeType: "io_chain", weight: 0.8 });
        }
      }
    }
  }

  if (ioEdges.length > 0) {
    store.bulkAddEdges(ioEdges);
    ioChainEdges = ioEdges.length;
  }

  // 3. Compute same_domain edges
  opts?.onProgress?.("same-domain", 0, total);
  const domainGroups = new Map<string, string[]>();
  for (const skill of skills) {
    const group = domainGroups.get(skill.domain) ?? [];
    group.push(skill.id);
    domainGroups.set(skill.domain, group);
  }

  const domainEdges: Array<{ sourceId: string; targetId: string; edgeType: EdgeType; weight: number }> = [];
  for (const [, ids] of domainGroups) {
    // Connect each pair within the domain (limit to avoid O(n^2) explosion)
    const limited = ids.slice(0, 100);
    for (let i = 0; i < limited.length; i++) {
      for (let j = i + 1; j < limited.length; j++) {
        domainEdges.push(
          { sourceId: limited[i]!, targetId: limited[j]!, edgeType: "same_domain", weight: 0.5 },
          { sourceId: limited[j]!, targetId: limited[i]!, edgeType: "same_domain", weight: 0.5 },
        );
      }
    }
  }

  if (domainEdges.length > 0) {
    store.bulkAddEdges(domainEdges);
    sameDomainEdges = domainEdges.length;
  }

  // 4. Compute embedding similarity edges (if vec store available)
  if (vecStore && vecStore.count() > 0) {
    opts?.onProgress?.("embedding-similar", 0, total);
    const embEdges: Array<{ sourceId: string; targetId: string; edgeType: EdgeType; weight: number }> = [];

    // Pre-load all embeddings via the database for cosine comparison
    const db = store.getDb();
    const allEmbRows = db.prepare(`SELECT id, embedding FROM vec_skills`).all() as Array<{ id: string; embedding: Buffer }>;
    const embeddingMap = new Map<string, Float32Array>();
    for (const row of allEmbRows) {
      if (row.embedding) {
        embeddingMap.set(row.id, new Float32Array(
          row.embedding.buffer,
          row.embedding.byteOffset,
          row.embedding.byteLength / 4,
        ));
      }
    }

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i]!;
      const embedding = embeddingMap.get(skill.id);
      if (!embedding) continue;

      // Find nearest neighbors using vecStore KNN, then verify with cosine()
      const neighbors = vecStore.search(embedding, 10);
      for (const neighbor of neighbors) {
        if (neighbor.id === skill.id) continue;
        const neighborEmb = embeddingMap.get(neighbor.id);
        // Use cosine() from guards.ts for similarity computation
        const similarity = neighborEmb ? cosine(embedding, neighborEmb) : 1 - neighbor.distance;
        if (similarity >= threshold) {
          embEdges.push({
            sourceId: skill.id,
            targetId: neighbor.id,
            edgeType: "embedding_similar",
            weight: similarity,
          });
        }
      }

      if (i % 50 === 0) opts?.onProgress?.("embedding-similar", i, total);
    }

    if (embEdges.length > 0) {
      store.bulkAddEdges(embEdges);
      embeddingSimilarEdges = embEdges.length;
    }
  }

  // 5. Compute LLM-inferred edges (optional, slow)
  if (opts?.includeLLM) {
    // Pre-build connected set so LLM function doesn't re-scan edge arrays
    const connectedPairs = new Set<string>();
    for (const e of [...ioEdges, ...domainEdges]) {
      connectedPairs.add(`${e.sourceId}::${e.targetId}`);
      connectedPairs.add(`${e.targetId}::${e.sourceId}`);
    }
    const llmEdges = await computeLlmInferredEdges(store, skills, connectedPairs, opts);
    if (llmEdges.length > 0) {
      store.bulkAddEdges(llmEdges);
      llmInferredEdges = llmEdges.length;
    }
  }

  const totalEdges = ioChainEdges + sameDomainEdges + embeddingSimilarEdges + llmInferredEdges;

  return {
    ioChainEdges,
    sameDomainEdges,
    embeddingSimilarEdges,
    llmInferredEdges,
    totalEdges,
    durationMs: Date.now() - start,
  };
}

// ── LLM-inferred edges ─────────────────────────────────────────────────

/**
 * Sample skill pairs not already connected and ask an LLM if they can chain.
 * Returns edges with weight = LLM confidence for pairs above threshold.
 */
async function computeLlmInferredEdges(
  _store: UnifiedStore,
  skills: SkillRecord[],
  connected: Set<string>,
  opts?: GraphBuildOptions,
): Promise<Array<{ sourceId: string; targetId: string; edgeType: EdgeType; weight: number; metadata: Record<string, unknown> }>> {
  const { TieredLLMClient } = await import("../composer/llm-client.js");
  const llm = new TieredLLMClient();

  // Sample up to 50 unconnected pairs from different domains
  const pairs: Array<[SkillRecord, SkillRecord]> = [];
  const maxPairs = 50;

  for (let i = 0; i < skills.length && pairs.length < maxPairs; i++) {
    for (let j = i + 1; j < skills.length && pairs.length < maxPairs; j++) {
      const a = skills[i]!;
      const b = skills[j]!;
      if (a.domain === b.domain) continue;
      if (connected.has(`${a.id}::${b.id}`)) continue;
      pairs.push([a, b]);
    }
  }

  opts?.onProgress?.("llm-inferred", 0, pairs.length);
  const edges: Array<{ sourceId: string; targetId: string; edgeType: EdgeType; weight: number; metadata: Record<string, unknown> }> = [];

  for (let i = 0; i < pairs.length; i++) {
    const [a, b] = pairs[i]!;
    try {
      const prompt = `Can the output of skill "${a.name}" (${a.description}) be used as input for skill "${b.name}" (${b.description})? Answer with a JSON object: {"chainable": true/false, "confidence": 0.0-1.0, "reason": "..."}`;
      const response = await llm.generate("repair", prompt);
      const parsed = JSON.parse(response.content);

      if (parsed.chainable && typeof parsed.confidence === "number" && parsed.confidence >= 0.7) {
        edges.push({
          sourceId: a.id,
          targetId: b.id,
          edgeType: "llm_inferred",
          weight: parsed.confidence,
          metadata: { reason: parsed.reason ?? "", model: response.model },
        });
      }
    } catch {
      // Skip failed LLM calls
    }

    if (i % 10 === 0) opts?.onProgress?.("llm-inferred", i, pairs.length);
  }

  opts?.onProgress?.("llm-inferred", pairs.length, pairs.length);
  return edges;
}

// ── Helpers ────────────────────────────────────────────────────────────

function loadSkillMd(skill: SkillRecord): string | null {
  if (!skill.skill_dir) return null;
  const path = join(skill.skill_dir, "SKILL.md");
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}
