/**
 * forge/mode-trending.ts — GitHub trending → filter CLI tools → forge skills.
 */

import { success, emit } from "../../lib/output.js";
import {
  scrapeTrendingHtml,
  isLikelyCli,
  getWellKnownCliRepos,
  type TrendingRepo,
} from "../../lib/classifier/github.js";
import type { CliArgs, BatchItem } from "./types.js";
import { log, fmtTable } from "./helpers.js";
import { processBatch, buildIndexes } from "./stages.js";

export async function trendingMode(args: CliArgs, startTime: number): Promise<void> {
  log(`  Mode:     trending`);
  log(`  Language: ${args.language || "all"}`);
  log(`  Period:   ${args.since}`);
  log(`  Limit:    ${args.limit}`);
  log(`  Dry run:  ${args.dryRun}`);
  log("");

  const validSince = ["daily", "weekly", "monthly"];
  if (!validSince.includes(args.since)) {
    log(`  ERROR: --since must be one of: ${validSince.join(", ")} (got "${args.since}")`);
    process.exitCode = 1;
    return;
  }

  log(`  Scraping GitHub trending page...`);
  let allRepos = await scrapeTrendingHtml(args.language, args.since);
  log(`  Found ${allRepos.length} trending repos`);

  if (allRepos.length === 0) {
    log("  Scraping returned 0 repos — falling back to well-known CLI repos...");
    allRepos = getWellKnownCliRepos();
  }

  const cliCandidates: { repo: TrendingRepo; reason: string }[] = [];
  const nonCli: TrendingRepo[] = [];

  for (const repo of allRepos) {
    const { likely, reason } = isLikelyCli(repo);
    if (likely) {
      cliCandidates.push({ repo, reason });
    } else {
      nonCli.push(repo);
    }
  }

  const supplementRepos = cliCandidates.length < 10 ? getWellKnownCliRepos() : [];
  const seen = new Set(allRepos.map(r => r.fullName));
  const extra = supplementRepos.filter(r => !seen.has(r.fullName));

  const toProcess = [
    ...cliCandidates.map(c => c.repo),
    ...extra,
    ...nonCli,
  ].slice(0, args.limit);

  log(`  CLI candidates: ${cliCandidates.length} (strong match)`);
  for (const { repo, reason } of cliCandidates.slice(0, args.limit)) {
    log(`    ${repo.fullName} — ${reason}`);
  }

  if (args.dryRun) {
    log(`\n  Dry run complete. ${toProcess.length} repos would be processed.`);
    if (args.json) {
      emit(success("skill-forge:trending", {
        repos: toProcess.map(r => ({ fullName: r.fullName, language: r.language, description: r.description })),
        cliCandidates: cliCandidates.length,
        total: toProcess.length,
      }, startTime), true);
    }
    return;
  }

  const repoMap = new Map(toProcess.map(r => [r.fullName, r]));
  const batchItems: BatchItem[] = toProcess.map(r => ({ label: r.fullName, source: r.fullName }));
  const { results, failures } = await processBatch(batchItems, { deep: args.deep, noCache: args.noCache, force: args.force });

  if (results.length > 0) {
    log("\n  Building indexes...");
    await buildIndexes(results.map(r => r.tool), false);
  }

  log("\n  ═══════════════════════════════════════════════════════");
  log("  Trending Pipeline Summary");
  log("  ═══════════════════════════════════════════════════════");
  log(`  Processed: ${results.length} | Failed: ${failures.length}`);

  if (results.length > 0) {
    const rows = results.map(r => {
      const repo = repoMap.get(r.label);
      return [
        r.tool.meta.name.slice(0, 25),
        repo?.language ?? "",
        `${r.tool.capabilities.commands.length}`,
        r.quality.triggerScore.toFixed(2),
        r.quality.passed ? "PASS" : "FAIL",
      ];
    });
    log(fmtTable(rows, ["Skill", "Lang", "Cmds", "Trigger", "Status"]));
  }

  if (args.json) {
    emit(success("skill-forge:trending", {
      processed: results.length,
      failed: failures.length,
      results: results.map(r => ({
        name: r.tool.meta.name,
        repo: r.label,
        commands: r.tool.capabilities.commands.length,
        quality: r.quality,
      })),
    }, startTime), true);
  }
}
