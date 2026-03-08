/**
 * forge/helpers.ts — Shared utility functions for skill-forge.
 */

import { writeFileSync, renameSync } from "node:fs";
import { randomBytes } from "node:crypto";
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
