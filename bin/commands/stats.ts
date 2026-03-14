import { Command } from "commander";
import { success, failure, emit, toErrorMessage } from "../../lib/output.js";
import { isJsonMode, getStore } from "./shared.js";

export function registerStatsCommand(program: Command): void {
  program
    .command("stats")
    .description("Show system-wide statistics from the unified store")
    .option("--json", "Output as structured JSON")
    .action(async (opts: { json?: boolean }) => {
      const start = Date.now();
      const json = isJsonMode(opts);

      try {
        const store = await getStore();
        const { gatherStats } = await import("../../lib/monitoring/stats.js");

        // Try to load vec store for embedding stats (optional)
        let vecStore = null;
        try {
          const { createVecStore } = await import("../../lib/db/vec-store.js");
          const db = store.getDb();
          const vs = createVecStore(db);
          await vs.init();
          vecStore = vs;
        } catch { /* sqlite-vec not available */ }

        const fullStats = gatherStats(store, vecStore);

        const result = success("stats", fullStats, start);
        if (json) { emit(result, true); return; }

        // ── Overview ──────────────────────────────────────────────
        console.log("System Statistics:");
        console.log(`  Tools:     ${fullStats.tools}`);
        console.log(`  Skills:    ${fullStats.skills}`);
        console.log(`  Workflows: ${fullStats.workflows}`);
        console.log(`  Edges:     ${fullStats.edges}`);
        console.log(`  Domains:   ${fullStats.domains}`);
        console.log();

        // ── Crawl Queue ───────────────────────────────────────────
        console.log("Crawl Queue:");
        console.log(`  Pending:    ${fullStats.crawl.pending}`);
        console.log(`  Processing: ${fullStats.crawl.processing}`);
        console.log(`  Done:       ${fullStats.crawl.done}`);
        console.log(`  Failed:     ${fullStats.crawl.failed}`);
        console.log();

        // ── Quality Distribution ──────────────────────────────────
        if (fullStats.qualityDistribution.length > 0) {
          console.log("Quality Distribution:");
          for (const q of fullStats.qualityDistribution) {
            const bar = "\u2588".repeat(Math.min(Math.ceil(q.count / 5), 40));
            console.log(`  ${q.tier.padEnd(10)} ${String(q.count).padStart(5)}  ${bar}`);
          }
          console.log();
        }

        // ── Top Domains ───────────────────────────────────────────
        if (fullStats.topDomains.length > 0) {
          console.log("Top Domains:");
          for (const d of fullStats.topDomains) {
            console.log(`  ${d.domain.padEnd(25)} ${d.count}`);
          }
          console.log();
        }

        // ── Registry Breakdown ────────────────────────────────────
        if (fullStats.registries.length > 0) {
          console.log("Registry Breakdown:");
          for (const r of fullStats.registries) {
            const pct = r.count > 0 ? Math.round((r.done / r.count) * 100) : 0;
            console.log(`  ${r.registry.padEnd(12)} ${String(r.count).padStart(5)} total  ${String(r.done).padStart(5)} done  (${pct}%)`);
          }
          console.log();
        }

        // ── Embedding Coverage ────────────────────────────────────
        console.log("Embedding Coverage:");
        console.log(`  Total skills: ${fullStats.embedding.total}`);
        console.log(`  Embedded:     ${fullStats.embedding.embedded}`);
        console.log(`  Coverage:     ${(fullStats.embedding.coverage * 100).toFixed(1)}%`);
        if (fullStats.embedding.model) {
          console.log(`  Model:        ${fullStats.embedding.model}`);
        }
        console.log();

        // ── Graph Density ─────────────────────────────────────────
        console.log("Graph Density:");
        console.log(`  Total edges:        ${fullStats.graph.totalEdges}`);
        console.log(`  Avg edges/skill:    ${fullStats.graph.avgEdgesPerSkill}`);
        if (fullStats.graph.edgesByType.length > 0) {
          for (const e of fullStats.graph.edgesByType) {
            console.log(`    ${e.type.padEnd(22)} ${e.count}`);
          }
        }

        emit(result, false);
      } catch (err) {
        const result = failure("stats", "STATS_ERROR", toErrorMessage(err), start);
        if (json) { emit(result, true); return; }
        console.error(`Stats failed: ${toErrorMessage(err)}`);
        process.exitCode = 1;
      }
    });
}
