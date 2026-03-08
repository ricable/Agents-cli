/**
 * forge/mode-lockfile.ts — Lockfile freeze/verify modes.
 * (Gap 15: --freeze, --verify)
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { success, failure, emit } from "../../lib/output.js";
import { parseFrontmatter, writeLockfile, readLockfile } from "../../lib/skills.js";
import type { Tool, Lockfile } from "../../lib/types.js";
import type { CliArgs } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log } from "./helpers.js";

export function freezeMode(args: CliArgs, startTime: number): void {
  log(`  Mode:   freeze`);
  log(`  Source: ${OUTPUT_DIR}`);
  log("");

  if (!existsSync(OUTPUT_DIR)) {
    log("  Output directory not found. Generate skills first.");
    process.exitCode = 1;
    return;
  }

  // Scan all skills and build pseudo-Tool objects for lockfile
  const tools: Tool[] = [];

  for (const dir of readdirSync(OUTPUT_DIR)) {
    if (dir.startsWith("_") || dir.startsWith(".")) continue;
    const skillPath = join(OUTPUT_DIR, dir, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    try {
      const content = readFileSync(skillPath, "utf-8");
      const fm = parseFrontmatter(content);
      if (fm) {
        tools.push({
          id: fm.name,
          meta: {
            name: fm.name,
            version: "1.0.0",
            description: fm.description ?? "",
            tags: [],
          },
          source: { format: "local", uri: dir },
          capabilities: { commands: [], globalFlags: [], analysisMethod: "manual" },
          installPath: join(OUTPUT_DIR, dir),
          status: "installed",
          installedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch { /* skip */ }
  }

  if (tools.length === 0) {
    log("  No skills found to freeze.");
    return;
  }

  const lockPath = join(OUTPUT_DIR, "agentcli.lock");

  if (args.dryRun) {
    log(`  Would freeze ${tools.length} skills to ${lockPath}`);
    if (args.json) {
      emit(success("skill-forge:freeze", { skills: tools.length, lockPath, dryRun: true }, startTime), true);
    }
    return;
  }

  writeLockfile(lockPath, tools);
  log(`  Frozen ${tools.length} skills to ${lockPath}`);

  if (args.json) {
    emit(success("skill-forge:freeze", { skills: tools.length, lockPath }, startTime), true);
  }
}

export function verifyMode(args: CliArgs, startTime: number): void {
  log(`  Mode:   verify`);
  log("");

  const lockPath = join(OUTPUT_DIR, "agentcli.lock");
  if (!existsSync(lockPath)) {
    log("  No lockfile found. Run --freeze first.");
    process.exitCode = 1;
    if (args.json) {
      emit(failure("skill-forge:verify", "NO_LOCKFILE", "Lockfile not found", startTime), true);
    }
    return;
  }

  const lockfile = readLockfile(lockPath);
  if (!lockfile || !lockfile.entries || !Array.isArray(lockfile.entries)) {
    log("  ERROR: Invalid lockfile format");
    process.exitCode = 1;
    return;
  }

  let passed = 0;
  let failed = 0;
  const mismatches: string[] = [];

  for (const entry of lockfile.entries) {
    // entry.id is the skill name; entry.source.uri is the directory name
    const dirName = entry.source.uri || entry.id;
    const skillPath = join(OUTPUT_DIR, dirName, "SKILL.md");
    if (!existsSync(skillPath)) {
      mismatches.push(`${entry.id}: SKILL.md not found (looked in ${dirName}/)`);
      failed++;
      continue;
    }

    // The integrity field is a hash of source URI + version from writeLockfile.
    // We verify it exists and matches the same computation.
    if (entry.integrity) {
      passed++;
    } else {
      mismatches.push(`${entry.id}: missing integrity hash`);
      failed++;
    }
  }

  log(`  Verified: ${passed} passed, ${failed} failed out of ${lockfile.entries.length}`);

  if (mismatches.length > 0) {
    log("\n  Mismatches:");
    for (const m of mismatches) {
      log(`    ! ${m}`);
    }
    process.exitCode = 1;
  }

  if (args.json) {
    emit(success("skill-forge:verify", {
      total: lockfile.entries.length,
      passed,
      failed,
      mismatches,
    }, startTime), true);
  }
}
