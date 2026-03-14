/**
 * Four skill discovery methods for workflow composition.
 *
 * 1. semantic: sqlite-vec KNN on query embedding
 * 2. domain-semantic: filter by domain hierarchy, then KNN
 * 3. multi-hop-llm: LLM reasons about needed skills, searches for each
 * 4. graph-traversal: BFS/DFS from seed skills along weighted edges
 */

import type { UnifiedStore, SkillRecord } from "../db/unified-store.js";
import type { VecStore } from "../db/vec-store.js";
import { embedText } from "./embeddings.js";
import type { TieredLLMClient } from "../composer/llm-client.js";

// ── Types ──────────────────────────────────────────────────────────────

export type DiscoveryMethod = "semantic" | "domain-semantic" | "multi-hop-llm" | "graph-traversal";

export interface DiscoveryOptions {
  method: DiscoveryMethod;
  query: string;
  /** For domain-semantic: target domain */
  domain?: string;
  /** For graph-traversal: seed skill IDs */
  seedSkills?: string[];
  /** Max results to return */
  limit?: number;
  /** For graph-traversal: max depth */
  maxDepth?: number;
  /** LLM client for multi-hop-llm */
  llmClient?: TieredLLMClient;
}

export interface DiscoveryResult {
  skills: SkillRecord[];
  method: DiscoveryMethod;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

// ── Main discovery function ────────────────────────────────────────────

/**
 * Discover relevant skills using the specified method.
 */
export async function discoverSkills(
  store: UnifiedStore,
  vecStore: VecStore | null,
  opts: DiscoveryOptions,
): Promise<DiscoveryResult> {
  const start = Date.now();
  const limit = opts.limit ?? 20;

  switch (opts.method) {
    case "semantic":
      return semanticDiscovery(store, vecStore, opts.query, limit, start);
    case "domain-semantic":
      return domainSemanticDiscovery(store, vecStore, opts.query, opts.domain ?? "general", limit, start);
    case "multi-hop-llm":
      return multiHopDiscovery(store, vecStore, opts.query, opts.llmClient, limit, start);
    case "graph-traversal":
      return graphTraversalDiscovery(store, opts.seedSkills ?? [], limit, opts.maxDepth ?? 3, start);
  }
}

// ── Method 1: Semantic ─────────────────────────────────────────────────

async function semanticDiscovery(
  store: UnifiedStore,
  vecStore: VecStore | null,
  query: string,
  limit: number,
  start: number,
): Promise<DiscoveryResult> {
  // Try vector search first
  if (vecStore && vecStore.count() > 0) {
    try {
      const embedding = await embedText(query);
      const results = vecStore.search(embedding, limit);

      const skills: SkillRecord[] = [];
      for (const r of results) {
        const skill = store.getSkill(r.id);
        if (skill) skills.push(skill);
      }

      return { skills, method: "semantic", durationMs: Date.now() - start, metadata: { source: "vec" } };
    } catch {
      // Fall back to FTS
    }
  }

  // Fallback: FTS5
  const skills = store.searchSkills(query, limit);
  return { skills, method: "semantic", durationMs: Date.now() - start, metadata: { source: "fts5" } };
}

// ── Method 2: Domain + Semantic ────────────────────────────────────────

async function domainSemanticDiscovery(
  store: UnifiedStore,
  vecStore: VecStore | null,
  query: string,
  domain: string,
  limit: number,
  start: number,
): Promise<DiscoveryResult> {
  // Get all skills in the target domain
  const domainSkills = store.listSkills({ domain, limit: 1000 });

  if (domainSkills.length === 0) {
    // Fall back to pure semantic
    return semanticDiscovery(store, vecStore, query, limit, start);
  }

  // If vec store available, do filtered KNN
  if (vecStore && vecStore.count() > 0) {
    try {
      const embedding = await embedText(query);
      const filterIds = domainSkills.map((s) => s.id);
      const results = vecStore.searchFiltered(embedding, filterIds, limit);

      const skills: SkillRecord[] = [];
      for (const r of results) {
        const skill = store.getSkill(r.id);
        if (skill) skills.push(skill);
      }

      return { skills, method: "domain-semantic", durationMs: Date.now() - start, metadata: { domain, source: "vec" } };
    } catch {
      // Fall back to simple domain filter
    }
  }

  // Fallback: simple domain filter sorted by quality
  const sorted = domainSkills
    .sort((a, b) => (b.trigger_score ?? 0) - (a.trigger_score ?? 0))
    .slice(0, limit);

  return { skills: sorted, method: "domain-semantic", durationMs: Date.now() - start, metadata: { domain, source: "quality-sort" } };
}

// ── Method 3: Multi-hop LLM ───────────────────────────────────────────

async function multiHopDiscovery(
  store: UnifiedStore,
  vecStore: VecStore | null,
  query: string,
  llmClient: TieredLLMClient | undefined,
  limit: number,
  start: number,
): Promise<DiscoveryResult> {
  if (!llmClient) {
    // Fallback to semantic without LLM
    return semanticDiscovery(store, vecStore, query, limit, start);
  }

  // Ask LLM to decompose the query into sub-queries
  const prompt = `Given this workflow need: "${query}"

List the specific types of tools needed, one per line. Be specific about tool categories.
For example: "python linter", "test runner", "coverage reporter", "docker builder"
Only output the tool types, nothing else.`;

  const response = await llmClient.generate("propose", prompt);
  const subQueries = response.content
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 3);

  // Search for each sub-query
  const allSkills = new Map<string, SkillRecord>();
  for (const subQuery of subQueries.slice(0, 8)) {
    const subResult = await semanticDiscovery(store, vecStore, subQuery, 5, Date.now());
    for (const skill of subResult.skills) {
      allSkills.set(skill.id, skill);
    }
  }

  const skills = [...allSkills.values()].slice(0, limit);
  return {
    skills,
    method: "multi-hop-llm",
    durationMs: Date.now() - start,
    metadata: { subQueries, hops: subQueries.length },
  };
}

// ── Method 4: Graph Traversal ──────────────────────────────────────────

function graphTraversalDiscovery(
  store: UnifiedStore,
  seedSkills: string[],
  limit: number,
  maxDepth: number,
  start: number,
): DiscoveryResult {
  const visited = new Set<string>();
  const results: SkillRecord[] = [];

  // BFS from seed skills, prioritized by edge weight
  let frontier = [...seedSkills.map((id) => ({ id, weight: 1.0 }))];
  let depth = 0;

  while (frontier.length > 0 && results.length < limit && depth < maxDepth) {
    const nextFrontier: Array<{ id: string; weight: number }> = [];

    for (const { id: skillId } of frontier) {
      if (visited.has(skillId)) continue;
      visited.add(skillId);

      const skill = store.getSkill(skillId);
      if (skill && !seedSkills.includes(skillId)) {
        results.push(skill);
      }

      // Get neighbors with weights
      const neighbors = store.getNeighbors(skillId);
      for (const n of neighbors) {
        if (!visited.has(n.id)) {
          nextFrontier.push({ id: n.id, weight: n.weight });
        }
      }
    }

    // Sort next frontier by edge weight (highest first)
    nextFrontier.sort((a, b) => b.weight - a.weight);
    frontier = nextFrontier;
    depth++;
  }

  return {
    skills: results.slice(0, limit),
    method: "graph-traversal",
    durationMs: Date.now() - start,
    metadata: { seeds: seedSkills, depth, visited: visited.size },
  };
}
