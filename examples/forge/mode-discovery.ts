/**
 * forge/mode-discovery.ts — NL prompt → multi-registry search → forge skills.
 */

import { join } from "node:path";
import { success, emit } from "../../lib/output.js";
import { writeLockfile } from "../../lib/skills.js";
import type { Tool } from "../../lib/types.js";
import type { CliArgs, QualityResult, ForgedSkill } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log, fmtTable } from "./helpers.js";
import { discover, resolveInstallAnalyze, forgeSkill, assessQuality, buildIndexes } from "./stages.js";

export async function discoveryMode(args: CliArgs, startTime: number): Promise<void> {
  log(`  Mode:    discovery`);
  log(`  Prompt:  "${args.prompt}"`);
  log(`  Limit:   ${args.limit}`);
  log(`  Dry run: ${args.dryRun}`);
  log("");

  // Stage 1: Discovery
  const discovery = await discover(args.prompt, args.limit);

  if (discovery.packages.length === 0) {
    log("  No packages found. Try a more specific prompt.");
    return;
  }

  log("");
  const rows = discovery.packages.slice(0, 15).map(p => [
    p.name.slice(0, 35),
    p.source,
    (p.relevance * 100).toFixed(0) + "%",
    p.description.slice(0, 50),
  ]);
  log(fmtTable(rows, ["Package", "Source", "Relevance", "Description"]));

  if (args.dryRun) {
    log("\n  Dry run complete. Remove --dry-run to install and forge skills.");
    return;
  }

  // Stage 2-7: Process top packages
  log("");
  const tools: Tool[] = [];
  const forged: Array<{ tool: Tool; result: ForgedSkill; quality: QualityResult }> = [];

  for (const pkg of discovery.packages.slice(0, args.limit)) {
    log(`\n  ── Forging: ${pkg.name} ──`);
    try {
      const source = pkg.source === "github" ? pkg.name
                   : pkg.source === "crates" ? `crates:${pkg.name}`
                   : pkg.source === "pypi" ? `pypi:${pkg.name}`
                   : pkg.source === "npm" ? (pkg.name.startsWith("@") ? pkg.name : `npm:${pkg.name}`)
                   : pkg.name;
      const tool = await resolveInstallAnalyze(source, args.deep);
      const result = forgeSkill(tool, { dryRun: args.dryRun, noCache: args.noCache, force: args.force });
      if (result.skipped) {
        log(`  → CACHED (skipped)`);
        continue;
      }
      const quality = assessQuality(result.skillMd, tool.meta.name);
      tools.push(tool);
      forged.push({ tool, result, quality });
      log(`  → ${quality.passed ? "PASS" : "FAIL"} (trigger: ${quality.triggerScore.toFixed(2)}, quality: ${quality.qualityScore}/10)`);
    } catch (err) {
      log(`  → SKIP: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Stage 8: Build indexes
  if (tools.length > 0) {
    log("\n  Building indexes...");
    await buildIndexes(tools, args.dryRun);
  }

  // Generate lockfile
  if (tools.length > 0 && !args.dryRun) {
    try {
      const lockPath = join(OUTPUT_DIR, "agentcli.lock");
      writeLockfile(lockPath, tools);
      log(`  Lockfile: ${lockPath}`);
    } catch (err) {
      log(`  WARN: lockfile generation failed: ${(err as Error).message}`);
    }
  }

  // Summary
  log("\n  ═══════════════════════════════════════════════════════");
  log("  Summary");
  log("  ═══════════════════════════════════════════════════════");
  log(`  Prompt:     "${args.prompt}"`);
  log(`  Intent:     ${discovery.intent} (${(discovery.confidence * 100).toFixed(0)}%)`);
  log(`  Discovered: ${discovery.packages.length} packages`);
  log(`  Forged:     ${forged.length} skills`);
  log(`  Passed QA:  ${forged.filter(f => f.quality.passed).length}/${forged.length}`);
  log(`  Output:     ${OUTPUT_DIR}`);
  log("");

  if (forged.length > 0) {
    const summaryRows = forged.map(f => [
      f.tool.meta.name.slice(0, 25),
      `${f.tool.capabilities.commands.length}`,
      `${Object.keys(f.result.files).length}`,
      f.quality.triggerScore.toFixed(2),
      `${f.quality.qualityScore}`,
      f.quality.passed ? "PASS" : "FAIL",
    ]);
    log(fmtTable(summaryRows, ["Skill", "Cmds", "Files", "Trigger", "Quality", "Status"]));
  }

  if (args.json) {
    emit(success("skill-forge", {
      prompt: args.prompt,
      intent: discovery.intent,
      discovered: discovery.packages.length,
      forged: forged.map(f => ({
        name: f.tool.meta.name,
        commands: f.tool.capabilities.commands.length,
        files: Object.keys(f.result.files),
        quality: f.quality,
      })),
    }, startTime), true);
  }
}
