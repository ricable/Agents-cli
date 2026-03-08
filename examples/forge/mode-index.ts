/**
 * forge/mode-index.ts — Rebuild search index from generated skills.
 * (Gap 3: --index mode)
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { success, emit } from "../../lib/output.js";
import type { CliArgs } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log } from "./helpers.js";

export async function indexMode(args: CliArgs, startTime: number): Promise<void> {
  const { indexSources } = await import("../../lib/indexer.js");
  const { closeAllDomainDbs } = await import("../../lib/db/domain-db.js");

  log(`  Mode:   index`);
  if (args.domain) log(`  Domain: ${args.domain}`);
  log(`  Source: ${OUTPUT_DIR}`);
  log("");

  if (!existsSync(OUTPUT_DIR)) {
    log("  Output directory not found. Generate skills first.");
    process.exitCode = 1;
    return;
  }

  // Discover skill directories
  const skillDirs: string[] = [];
  try {
    for (const entry of readdirSync(OUTPUT_DIR)) {
      const full = join(OUTPUT_DIR, entry);
      if (entry.startsWith("_index-")) continue; // skip index dirs
      if (entry.startsWith(".")) continue;
      try {
        if (statSync(full).isDirectory()) {
          skillDirs.push(full);
        }
      } catch { /* skip */ }
    }
  } catch (err) {
    log(`  ERROR: Failed to read output directory: ${(err as Error).message}`);
    process.exitCode = 1;
    return;
  }

  log(`  Found ${skillDirs.length} skill directories`);

  if (args.dryRun) {
    log(`\n  Dry run complete. ${skillDirs.length} directories would be indexed.`);
    if (args.json) {
      emit(success("skill-forge:index", { directories: skillDirs.length, dryRun: true }, startTime), true);
    }
    return;
  }

  try {
    const result = await indexSources({
      sourceDirs: [OUTPUT_DIR],
      domain: args.domain || undefined,
      flat: !args.domain, // Use flat mode (agentdb.sqlite) when no domain specified
    });

    log(`  Indexed: ${result.totalChunks} chunks from ${result.packages} packages`);

    if (args.json) {
      emit(success("skill-forge:index", {
        totalChunks: result.totalChunks,
        packages: result.packages,
      }, startTime), true);
    }
  } catch (err) {
    log(`  Indexing failed: ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeAllDomainDbs();
  }
}
