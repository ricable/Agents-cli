/**
 * forge/helpers.ts — Shared utility functions for skill-forge.
 */

import { writeFileSync, renameSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { parseFrontmatter } from "../../lib/skills.js";
import type { Tool, ManifestEntry } from "../../lib/types.js";
import { DOMAIN_TRIGGERS } from "../../lib/domains.js";

// ── Logging ────────────────────────────────────────────────────────────

let _quiet = false;

export function setQuiet(val: boolean): void {
  _quiet = val;
}

export function log(msg: string): void {
  if (!_quiet) console.log(msg);
}

// ── Atomic file writes ────────────────────────────────────────────────

export function atomicWrite(filePath: string, content: string): void {
  const tmp = filePath + ".tmp." + randomBytes(4).toString("hex");
  writeFileSync(tmp, content, "utf-8");
  renameSync(tmp, filePath);
}

// ── Domain inference ──────────────────────────────────────────────────

export function inferDomainFromTool(tool: Tool): string {
  const text = `${tool.meta.name} ${tool.meta.description} ${(tool.meta.tags as string[]).join(" ")}`.toLowerCase();
  let bestDomain = "build";
  let bestScore = 0;
  for (const [domain, triggers] of Object.entries(DOMAIN_TRIGGERS)) {
    const keywords = triggers.toLowerCase().split(/[,\s]+/).filter(k => k.length > 3);
    const hits = keywords.filter(k => text.includes(k)).length;
    if (hits > bestScore) { bestScore = hits; bestDomain = domain; }
  }
  return bestDomain;
}

// ── Tool → ManifestEntry ──────────────────────────────────────────────

export function toolToManifestEntry(tool: Tool): ManifestEntry | null {
  const domain = inferDomainFromTool(tool);
  const repo = tool.source.format === "github" ? tool.source.uri : tool.meta.name;
  return {
    name: tool.meta.name,
    repo,
    domain,
    description: tool.meta.description || `CLI tool: ${tool.meta.name}`,
  };
}

// ── Scan skill directories ────────────────────────────────────────────

/**
 * Scan a skills directory for SKILL.md files and return ManifestEntry[].
 * Shared by mode-audit, mode-plugin, mode-lockfile, and bin/agents-cli.
 */
export function scanSkillEntries(dir: string): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  if (!existsSync(dir)) return entries;

  for (const name of readdirSync(dir)) {
    if (name.startsWith("_") || name.startsWith(".")) continue;
    const skillPath = join(dir, name, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    try {
      const content = readFileSync(skillPath, "utf-8");
      const fm = parseFrontmatter(content);
      if (fm) {
        entries.push({
          name: fm.name,
          repo: "",
          domain: fm.domain ?? "uncategorized",
          description: fm.description ?? "",
        });
      }
    } catch {
      log(`  WARN: Failed to parse ${skillPath}`);
    }
  }

  return entries;
}

// ── Table formatter ───────────────────────────────────────────────────

export function fmtTable(rows: string[][], headers: string[]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? "").length))
  );
  const sep = widths.map(w => "─".repeat(w + 2)).join("┼");
  const fmt = (row: string[]) =>
    row.map((c, i) => ` ${(c ?? "").padEnd(widths[i]!)} `).join("│");

  return [
    `┌${sep.replace(/┼/g, "┬")}┐`,
    `│${fmt(headers)}│`,
    `├${sep}┤`,
    ...rows.map(r => `│${fmt(r)}│`),
    `└${sep.replace(/┼/g, "┴")}┘`,
  ].join("\n");
}
