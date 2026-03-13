/**
 * forge/mode-lockfile.ts — Lockfile freeze/verify modes.
 * (Gap 15: --freeze, --verify)
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { success, failure, emit } from "../../lib/output.js";
import { writeLockfile, readLockfile, computeIntegrity } from "../../lib/skills.js";
import type { Tool } from "../../lib/types.js";
import type { CliArgs } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log, scanSkillEntries } from "./helpers.js";

export function freezeMode(args: CliArgs, startTime: number): void {
  log(`  Mode:   freeze`);
  log(`  Source: ${OUTPUT_DIR}`);
  log("");

  if (!existsSync(OUTPUT_DIR)) {
    log("  Output directory not found. Generate skills first.");
    if (args.json) {
      emit(failure("skill-forge:freeze", "NO_OUTPUT_DIR", "Output directory not found", startTime), true);
    }
    process.exitCode = 1;
    return;
  }

  // Scan all skills and build pseudo-Tool objects for lockfile
  const entries = scanSkillEntries(OUTPUT_DIR);
  // Use the actual directory name from scanSkillEntries, not the frontmatter name
  // This ensures lockfile entries match the actual directory structure for verification
  const tools: Tool[] = entries.map(e => ({
    id: e.dirName || e.name,  // Use directory name for consistency
    meta: {
      name: e.name,  // Keep frontmatter name for skill metadata
      version: "1.0.0",
      description: e.description ?? "",
      tags: [],
    },
    source: { format: "local", uri: e.dirName || e.name },  // Use directory name for uri
    capabilities: { commands: [], globalFlags: [], analysisMethod: "manual" as const },
    installPath: join(OUTPUT_DIR, e.name),
    status: "installed" as const,
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  if (tools.length === 0) {
    log("  No skills found to freeze.");
    if (args.json) {
      emit(failure("skill-forge:freeze", "NO_SKILLS", "No skills found to freeze", startTime), true);
    }
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
    if (args.json) {
      emit(failure("skill-forge:verify", "INVALID_LOCKFILE", "Invalid lockfile format", startTime), true);
    }
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

    // Recompute the integrity hash and compare against the stored value.
    if (!entry.integrity) {
      mismatches.push(`${entry.id}: missing integrity hash`);
      failed++;
    } else {
      const expected = computeIntegrity(entry.source.uri, entry.version);
      if (entry.integrity !== expected) {
        mismatches.push(`${entry.id}: integrity mismatch (expected ${expected.slice(0, 12)}..., got ${entry.integrity.slice(0, 12)}...)`);
        failed++;
      } else {
        passed++;
      }
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
