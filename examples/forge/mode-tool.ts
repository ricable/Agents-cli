/**
 * forge/mode-tool.ts — Direct --tool mode.
 */

import { existsSync } from "node:fs";
import { success, emit } from "../../lib/output.js";
import { getToolInstallDir } from "../../lib/store.js";
import { walkPackageDirs } from "../../lib/pkg-utils.js";
import type { Tool } from "../../lib/types.js";
import type { CliArgs } from "./types.js";
import { DATA_DIR } from "./types.js";
import { log } from "./helpers.js";
import { resolveInstallAnalyze, forgeSkill, assessQuality, persistChunks } from "./stages.js";
import { inferDomainFromTool } from "./helpers.js";

export async function toolMode(args: CliArgs, startTime: number): Promise<void> {
  log(`  Mode:     direct tool`);
  log(`  Source:   ${args.tool}`);
  log(`  Deep:     ${args.deep}`);
  log(`  Dry run:  ${args.dryRun}`);
  log(`  Factory:  ${args.factory}`);
  log(`  Monorepo: ${args.monorepo}`);
  log("");

  const tool = await resolveInstallAnalyze(args.tool, args.deep);

  // Monorepo mode (Gap 16): discover sub-packages
  if (args.monorepo) {
    await monorepoMode(tool, args, startTime);
    return;
  }

  // Factory mode (Gap 6): delegate to skill-factory
  if (args.factory) {
    await factoryMode(tool, args, startTime);
    return;
  }

  const forged = forgeSkill(tool, { dryRun: args.dryRun, noCache: args.noCache, force: args.force });

  if (forged.skipped) {
    log("\n  Skill already cached. Use --force or --no-cache to regenerate.");
    if (args.json) {
      emit(success("skill-forge", { tool: tool.meta.name, cached: true }, startTime), true);
    }
    return;
  }

  const quality = assessQuality(forged.skillMd, tool.meta.name);

  // Persist chunks to domain DB (Gap 3)
  if (!args.dryRun) {
    try {
      const domain = inferDomainFromTool(tool);
      const persisted = await persistChunks(tool, domain);
      if (persisted > 0) {
        log(`  Persisted ${persisted} chunks to ${domain} DB`);
      }
    } catch {
      // DB persistence is non-fatal
    }
  }

  printResult(tool, forged, quality, args);

  if (args.json) {
    emit(success("skill-forge", {
      tool: tool.meta.name,
      version: tool.meta.version,
      commands: tool.capabilities.commands.length,
      flags: tool.capabilities.globalFlags.length,
      chunks: forged.chunkStats,
      quality,
      files: Object.keys(forged.files),
      dir: forged.dir,
    }, startTime), true);
  }

  if (args.strict && !quality.passed) {
    process.exitCode = 1;
  }
}

async function factoryMode(tool: Tool, args: CliArgs, startTime: number): Promise<void> {
  const { join } = await import("node:path");
  const { writeFileSync, mkdirSync, symlinkSync, existsSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { randomBytes } = await import("node:crypto");
  const { runSkillFactory } = await import("../../lib/skill-factory.js");
  const { toolToManifestEntry } = await import("./helpers.js");
  const { OUTPUT_DIR } = await import("./types.js");

  const entry = toolToManifestEntry(tool);
  if (!entry) {
    log("  ERROR: Could not create manifest entry for tool");
    process.exitCode = 1;
    return;
  }

  const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);

  // runSkillFactory expects repos at {opensrcDir}/repos/github.com/{entry.repo}
  // For non-GitHub tools, create a temp structure with a symlink
  const tmpDir = join(tmpdir(), "skill-forge-" + randomBytes(4).toString("hex"));
  const repoSlug = entry.repo.includes("/") ? entry.repo : `local/${entry.repo}`;
  const expectedRepoDir = join(tmpDir, "repos", "github.com", repoSlug);

  mkdirSync(join(tmpDir, "repos", "github.com", repoSlug.split("/")[0]!), { recursive: true });
  if (existsSync(installDir)) {
    symlinkSync(installDir, expectedRepoDir);
  }

  // Override entry.repo to match the symlinked path
  const factoryEntry = { ...entry, repo: repoSlug };
  const manifestPath = join(tmpDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify({ repos: [factoryEntry] }), "utf-8");

  const result = await runSkillFactory({
    manifestPath,
    skillsDir: OUTPUT_DIR,
    opensrcDir: tmpDir,
    ai: args.ai,
    force: args.force,
    dryRun: args.dryRun,
    strict: args.strict,
  });

  log(`\n  Factory result: generated=${result.generated}, skipped=${result.skipped}, errors=${result.errors.length}`);
  if (result.errors.length > 0) {
    for (const e of result.errors) log(`    ! ${e}`);
  }

  if (args.json) {
    emit(success("skill-forge:factory", result, startTime), true);
  }
}

async function monorepoMode(tool: Tool, args: CliArgs, startTime: number): Promise<void> {
  const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);
  if (!existsSync(installDir)) {
    log("  ERROR: Install directory not found for monorepo discovery");
    process.exitCode = 1;
    return;
  }

  log(`  Discovering sub-packages in ${tool.meta.name}...`);
  const subPackages: Array<{ name: string; dir: string }> = [];

  walkPackageDirs(installDir, (pkg) => {
    if (pkg.name && pkg.bin) {
      subPackages.push({ name: pkg.name, dir: pkg.dir });
      log(`    Found: ${pkg.name}`);
    }
  });

  if (subPackages.length === 0) {
    log("  No sub-packages with binaries found. Forging as single tool.");
    const forged = forgeSkill(tool, { dryRun: args.dryRun, noCache: args.noCache, force: args.force });
    if (!forged.skipped) {
      const quality = assessQuality(forged.skillMd, tool.meta.name);
      printResult(tool, forged, quality, args);
    }
    return;
  }

  log(`  Found ${subPackages.length} sub-packages`);

  // For now, forge the main tool plus report sub-packages
  const forged = forgeSkill(tool, { dryRun: args.dryRun, noCache: args.noCache, force: args.force });
  if (!forged.skipped) {
    const quality = assessQuality(forged.skillMd, tool.meta.name);
    printResult(tool, forged, quality, args);
  }

  if (args.json) {
    emit(success("skill-forge:monorepo", {
      tool: tool.meta.name,
      subPackages: subPackages.map(p => p.name),
    }, startTime), true);
  }
}

function printResult(tool: Tool, forged: { skillMd: string; files: Record<string, string>; chunkStats: { chunks: number; files: number }; dir: string }, quality: { triggerScore: number; qualityScore: number; passed: boolean; issues: string[]; triggerQueries: string[]; nonTriggerQueries: string[]; validationErrors?: string[] }, args: CliArgs): void {
  log("");
  log("  Result");
  log("  ─────────────────────────────────────────────────");
  log(`  Tool:       ${tool.meta.name}@${tool.meta.version}`);
  log(`  Source:     ${tool.source.uri}`);
  log(`  Commands:   ${tool.capabilities.commands.length}`);
  log(`  Flags:      ${tool.capabilities.globalFlags.length}`);
  log(`  Chunks:     ${forged.chunkStats.chunks} (${forged.chunkStats.files} files)`);
  log("");

  log("  Generated Files:");
  log(`    SKILL.md`);
  for (const relPath of Object.keys(forged.files).sort()) {
    log(`    ${relPath}`);
  }
  log("");

  log("  Quality Gate:");
  log(`    Trigger score:  ${quality.triggerScore.toFixed(2)} ${quality.triggerScore >= 0.8 ? "(PASS)" : "(FAIL, need >= 0.80)"}`);
  log(`    Quality score:  ${quality.qualityScore}/10 ${quality.qualityScore >= 6 ? "(PASS)" : "(FAIL, need >= 6)"}`);
  if (quality.validationErrors && quality.validationErrors.length > 0) {
    log(`    Validation:     ${quality.validationErrors.length} error(s)`);
    for (const e of quality.validationErrors) log(`      ! ${e}`);
  }
  if (quality.issues.length > 0) {
    for (const issue of quality.issues) {
      log(`    ! ${issue}`);
    }
  }
  log("");

  log("  Trigger Test Queries (should activate):");
  for (const q of quality.triggerQueries.slice(0, 5)) {
    log(`    - "${q}"`);
  }
  log("");

  log("  Non-Trigger Queries (should NOT activate):");
  for (const q of quality.nonTriggerQueries.slice(0, 3)) {
    log(`    - "${q}"`);
  }

  if (!args.dryRun) {
    log("");
    log(`  Output: ${forged.dir}/`);
    log(`  Validate: uv run ${forged.dir}/scripts/validate.py`);
  }
  log("");
}
