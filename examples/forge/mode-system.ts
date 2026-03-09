/**
 * forge/mode-system.ts — Scan PATH for executables, probe each with --help,
 * and forge skills for responsive CLIs.
 *
 * Inspired by CLI-Anything's shutil.which() backend discovery pattern.
 * Enables "forge skills for everything already on my machine" workflow.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, delimiter } from "node:path";
import { success, emit } from "../../lib/output.js";
import { createAnalyzer } from "../../lib/analyzer.js";
import { validateToolName } from "../../lib/guards.js";
import type { InteractionMode } from "../../lib/types.js";
import type { CliArgs } from "./types.js";
import { log, fmtTable } from "./helpers.js";

// ── Types ──────────────────────────────────────────────────────────────

interface SystemBinary {
  name: string;
  path: string;
  commandCount: number;
  flagCount: number;
  interactionMode: InteractionMode;
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Well-known non-CLI binaries to skip (shells, system tools, etc.) */
const SKIP_NAMES = new Set([
  "sh", "bash", "zsh", "fish", "csh", "tcsh", "dash", "ksh",
  "ls", "cp", "mv", "rm", "mkdir", "rmdir", "chmod", "chown", "chgrp",
  "cat", "head", "tail", "wc", "sort", "uniq", "cut", "tr", "tee",
  "grep", "sed", "awk", "find", "xargs", "env", "printenv",
  "echo", "printf", "test", "[", "true", "false", "yes",
  "cd", "pwd", "which", "whoami", "hostname", "uname", "date",
  "kill", "sleep", "wait", "time", "su", "sudo", "passwd",
  "ssh", "scp", "sftp", "login", "logout", "exit",
  "vi", "vim", "nano", "emacs", "ed", "ex",
  "less", "more", "man", "info", "whatis", "apropos",
  "ps", "top", "df", "du", "free", "mount", "umount",
  "ping", "ifconfig", "netstat", "route", "traceroute",
  "tar", "gzip", "gunzip", "bzip2", "zip", "unzip",
  "make", "cc", "gcc", "g++", "ld", "as", "ar",
  "ln", "readlink", "realpath", "basename", "dirname",
  "id", "groups", "w", "who", "last", "finger",
  "stty", "tput", "reset", "clear",
  "open", "xdg-open", "osascript",
  "dd", "mkfs", "fdisk", "diskutil",
  "launchctl", "systemctl", "journalctl",
  "dbus-daemon", "dbus-send", "dbus-monitor",
]);

/** Collect unique executable names from PATH directories. */
function discoverPathBinaries(limit: number): Array<{ name: string; path: string }> {
  const pathDirs = (process.env["PATH"] ?? "").split(delimiter);
  const seen = new Set<string>();
  const results: Array<{ name: string; path: string }> = [];
  // Over-collect by 5x since most binaries won't respond to --help
  const cap = limit * 5;

  for (const dir of pathDirs) {
    if (!dir || !existsSync(dir)) continue;
    let entries: string[];
    try { entries = readdirSync(dir); } catch { continue; }

    for (const entry of entries) {
      if (seen.has(entry) || SKIP_NAMES.has(entry)) continue;
      // Skip dotfiles and names with common non-CLI extensions
      if (entry.startsWith(".")) continue;
      if (/\.(sh|py|pl|rb|js|ts|dylib|so|a|o|dll|exe|bat|cmd|ps1)$/.test(entry)) continue;
      // Validate name is safe for use in paths/scripts
      try { validateToolName(entry); } catch { continue; }

      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (!st.isFile() || !(st.mode & 0o111)) continue;
      } catch { continue; }

      seen.add(entry);
      results.push({ name: entry, path: full });
      if (results.length >= cap) break;
    }
    if (results.length >= cap) break;
  }

  return results;
}

// ── Mode entry point ───────────────────────────────────────────────────

export async function systemMode(args: CliArgs, startTime: number): Promise<void> {
  log("  Mode:     system (PATH discovery)");
  log(`  Limit:    ${args.limit}`);
  log(`  Dry run:  ${args.dryRun}`);
  log("");

  log("  Scanning PATH for executables...");
  const candidates = discoverPathBinaries(args.limit);
  log(`  Found ${candidates.length} unique executables (excluding system builtins)`);

  log("  Probing with --help...\n");
  const responsive: SystemBinary[] = [];
  const analyzer = createAnalyzer();

  for (const { name, path } of candidates) {
    if (responsive.length >= args.limit) break;

    // Single analyze call handles probeHelp internally — no double-probing
    const caps = await analyzer.analyze(path, { timeout: 3000 });
    if (!caps.rawHelp) continue;

    responsive.push({
      name,
      path,
      commandCount: caps.commands.length,
      flagCount: caps.globalFlags.length,
      interactionMode: caps.interactionMode ?? "single",
    });
  }

  log(`  Responsive CLIs: ${responsive.length}\n`);

  if (responsive.length > 0) {
    const rows = responsive.map(b => [
      b.name.slice(0, 25),
      `${b.commandCount}`,
      `${b.flagCount}`,
      b.interactionMode,
      b.path.slice(0, 40),
    ]);
    log(fmtTable(rows, ["Name", "Cmds", "Flags", "Mode", "Path"]));
  }

  if (args.dryRun) {
    log(`\n  Dry run complete. ${responsive.length} CLIs would be forged.`);
    if (args.json) {
      emit(success("skill-forge:system", {
        discovered: candidates.length,
        responsive: responsive.length,
        binaries: responsive.map(b => ({
          name: b.name,
          path: b.path,
          commands: b.commandCount,
          flags: b.flagCount,
          interactionMode: b.interactionMode,
        })),
      }, startTime), true);
    }
    return;
  }

  // System binaries have absolute paths (e.g. /usr/bin/rg) which match
  // the local source format pattern in resolver.ts (starts with /)
  const { processBatch, buildIndexes } = await import("./stages.js");
  const { results, failures } = await processBatch(
    responsive.map(b => ({ label: b.name, source: b.path })),
    { deep: args.deep, noCache: args.noCache, force: args.force },
  );

  if (results.length > 0) {
    log("\n  Building indexes...");
    await buildIndexes(results.map(r => r.tool), false);
  }

  log("\n  ═══════════════════════════════════════════════════════");
  log("  System PATH Discovery Summary");
  log("  ═══════════════════════════════════════════════════════");
  log(`  Scanned:    ${candidates.length} executables`);
  log(`  Responsive: ${responsive.length} CLIs`);
  log(`  Forged:     ${results.length} skills`);
  log(`  Failed:     ${failures.length}`);

  if (args.json) {
    emit(success("skill-forge:system", {
      scanned: candidates.length,
      responsive: responsive.length,
      forged: results.length,
      failed: failures.length,
      results: results.map(r => ({
        name: r.tool.meta.name,
        commands: r.tool.capabilities.commands.length,
        quality: r.quality,
      })),
      failures,
    }, startTime), true);
  }
}
