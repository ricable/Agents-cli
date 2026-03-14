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
        const fullStats = gatherStats(store);

        const result = success("stats", fullStats, start);
        if (json) { emit(result, true); return; }

        console.log(`System Statistics:`);
        console.log(`  Tools:     ${fullStats.tools}`);
        console.log(`  Skills:    ${fullStats.skills}`);
        console.log(`  Workflows: ${fullStats.workflows}`);
        console.log(`  Edges:     ${fullStats.edges}`);
        console.log(`  Domains:   ${fullStats.domains}`);
        console.log();

        if (fullStats.qualityDistribution.length > 0) {
          console.log(`Quality Distribution:`);
          for (const q of fullStats.qualityDistribution) {
            console.log(`  ${q.tier.padEnd(10)} ${q.count}`);
          }
          console.log();
        }

        if (fullStats.topDomains.length > 0) {
          console.log(`Top Domains:`);
          for (const d of fullStats.topDomains) {
            console.log(`  ${d.domain.padEnd(20)} ${d.count}`);
          }
          console.log();
        }

        console.log(`Crawl Queue:`);
        console.log(`  Pending:    ${fullStats.crawl.pending}`);
        console.log(`  Processing: ${fullStats.crawl.processing}`);
        console.log(`  Done:       ${fullStats.crawl.done}`);
        console.log(`  Failed:     ${fullStats.crawl.failed}`);
      } catch (err) {
        const result = failure("stats", "STATS_ERROR", toErrorMessage(err), start);
        if (json) { emit(result, true); return; }
        console.error(`Stats failed: ${toErrorMessage(err)}`);
        process.exitCode = 1;
      }
    });
}
