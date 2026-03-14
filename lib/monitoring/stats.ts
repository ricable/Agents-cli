/**
 * System stats aggregator for the unified store.
 *
 * Provides comprehensive statistics about tools, skills, workflows,
 * edges, crawl queue, quality distribution, and graph density.
 */

import type { UnifiedStore, StoreStats } from "../db/unified-store.js";
import type { VecStore } from "../db/vec-store.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface SystemStats extends StoreStats {
  /** Quality distribution (excellent/good/fair/poor/unscored) */
  qualityDistribution: Array<{ tier: string; count: number }>;
  /** Top 10 domains by skill count */
  topDomains: Array<{ domain: string; count: number }>;
  /** Registry breakdown from crawl queue */
  registries: Array<{ registry: string; count: number; done: number }>;
  /** Embedding coverage */
  embedding: {
    total: number;
    embedded: number;
    coverage: number;
    model: string | null;
  };
  /** Graph density */
  graph: {
    totalEdges: number;
    edgesByType: Array<{ type: string; count: number }>;
    avgEdgesPerSkill: number;
  };
}

// ── Stats ──────────────────────────────────────────────────────────────

/**
 * Gather comprehensive system statistics.
 */
export function gatherStats(store: UnifiedStore, vecStore?: VecStore | null): SystemStats {
  const base = store.stats();
  const db = store.getDb();

  // Quality distribution
  const qualityDistribution = db.prepare(`
    SELECT
      CASE
        WHEN trigger_score >= 0.9 THEN 'excellent'
        WHEN trigger_score >= 0.8 THEN 'good'
        WHEN trigger_score >= 0.6 THEN 'fair'
        WHEN trigger_score IS NOT NULL THEN 'poor'
        ELSE 'unscored'
      END as tier,
      COUNT(*) as count
    FROM skills GROUP BY tier ORDER BY count DESC
  `).all() as Array<{ tier: string; count: number }>;

  // Top domains
  const topDomains = db.prepare(`
    SELECT domain, COUNT(*) as count
    FROM skills
    GROUP BY domain
    ORDER BY count DESC
    LIMIT 10
  `).all() as Array<{ domain: string; count: number }>;

  // Registry breakdown
  const registries = db.prepare(`
    SELECT registry, COUNT(*) as count,
           SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
    FROM crawl_queue
    GROUP BY registry
  `).all() as Array<{ registry: string; count: number; done: number }>;

  // Embedding coverage
  const embeddedCount = vecStore?.count() ?? 0;
  const embeddingModel = vecStore?.getMeta("model") ?? null;

  // Graph stats (derive total from grouped query to avoid redundant COUNT)
  const edgesByType = db.prepare(`
    SELECT edge_type as type, COUNT(*) as count
    FROM skill_edges
    GROUP BY edge_type
    ORDER BY count DESC
  `).all() as Array<{ type: string; count: number }>;
  const totalEdges = edgesByType.reduce((sum, row) => sum + row.count, 0);

  const avgEdgesPerSkill = base.skills > 0 ? totalEdges / base.skills : 0;

  return {
    ...base,
    qualityDistribution,
    topDomains,
    registries,
    embedding: {
      total: base.skills,
      embedded: embeddedCount,
      coverage: base.skills > 0 ? embeddedCount / base.skills : 0,
      model: embeddingModel,
    },
    graph: {
      totalEdges,
      edgesByType,
      avgEdgesPerSkill: Math.round(avgEdgesPerSkill * 100) / 100,
    },
  };
}
