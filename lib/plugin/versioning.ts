/**
 * plugin/versioning.ts — Auto-versioning and changelog generation for plugins.
 *
 * Computes content hashes, determines version bumps, and generates
 * CHANGELOG.md entries for each plugin.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Compute a SHA256 hash of all plugin content (excluding CHANGELOG.md and .claude-plugin/plugin.json version).
 */
export function computePluginHash(pluginDir: string): string {
  const hash = createHash("sha256");
  hashDirectory(pluginDir, hash, pluginDir);
  return hash.digest("hex").slice(0, 16);
}

/**
 * Determine if a version bump is needed by comparing current and previous hashes.
 */
export function shouldBumpVersion(currentHash: string, previousHash: string | undefined): boolean {
  if (!previousHash) return true;
  return currentHash !== previousHash;
}

/**
 * Bump a semver version string.
 * @param current Current version (e.g. "1.0.0")
 * @param changeType "major" | "minor" | "patch"
 */
export function bumpVersion(current: string, changeType: "major" | "minor" | "patch"): string {
  const parts = current.split(".").map(Number);
  const major = parts[0] ?? 1;
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;

  switch (changeType) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Generate or update CHANGELOG.md for a plugin.
 */
export function generateChangelog(
  domain: string,
  version: string,
  changes: ChangeEntry[],
): string {
  const date = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# Changelog — ${domain}`,
    "",
    `## [${version}] — ${date}`,
    "",
  ];

  const grouped = groupChanges(changes);

  if (grouped.added.length > 0) {
    lines.push("### Added");
    for (const c of grouped.added) lines.push(`- ${c}`);
    lines.push("");
  }
  if (grouped.changed.length > 0) {
    lines.push("### Changed");
    for (const c of grouped.changed) lines.push(`- ${c}`);
    lines.push("");
  }
  if (grouped.fixed.length > 0) {
    lines.push("### Fixed");
    for (const c of grouped.fixed) lines.push(`- ${c}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Detect changes between two plugin versions by comparing directory contents.
 */
export function detectChanges(pluginDir: string, previousSkills: Set<string>): ChangeEntry[] {
  const changes: ChangeEntry[] = [];
  const skillsDir = path.join(pluginDir, "skills");

  if (fs.existsSync(skillsDir)) {
    for (const name of fs.readdirSync(skillsDir)) {
      if (previousSkills.has(name)) {
        changes.push({ type: "changed", message: `Updated skill: ${name}` });
      } else {
        changes.push({ type: "added", message: `New skill: ${name}` });
      }
    }
  }

  // Check for hooks
  if (fs.existsSync(path.join(pluginDir, "hooks", "hooks.json"))) {
    changes.push({ type: "added", message: "Added lifecycle hooks" });
  }

  // Check for agents
  const agentsDir = path.join(pluginDir, "agents");
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith(".md"));
    if (agents.length > 1) {
      changes.push({ type: "added", message: `Added ${agents.length} specialized agents` });
    }
  }

  return changes;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface ChangeEntry {
  type: "added" | "changed" | "fixed";
  message: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function hashDirectory(dir: string, hash: ReturnType<typeof createHash>, baseDir: string): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    // Skip changelog and audit logs
    if (entry.name === "CHANGELOG.md" || entry.name.startsWith(".")) continue;

    if (entry.isDirectory()) {
      hashDirectory(fullPath, hash, baseDir);
    } else if (entry.isFile()) {
      // Skip version field in plugin.json
      if (relativePath === path.join(".claude-plugin", "plugin.json")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const withoutVersion = content.replace(/"version"\s*:\s*"[^"]*"/, '"version": "0.0.0"');
        hash.update(relativePath);
        hash.update(withoutVersion);
      } else {
        hash.update(relativePath);
        hash.update(fs.readFileSync(fullPath));
      }
    }
  }
}

function groupChanges(changes: ChangeEntry[]): { added: string[]; changed: string[]; fixed: string[] } {
  const grouped = { added: [] as string[], changed: [] as string[], fixed: [] as string[] };
  for (const c of changes) {
    grouped[c.type].push(c.message);
  }
  return grouped;
}
