/**
 * Domain index and master registry skill generation.
 *
 * Implements the hierarchical discovery system for large skill collections:
 *
 *   src-index/           <- master registry (always loadable)
 *   src-index-{domain}/  <- per-domain index (one per domain)
 *   src-{name}/          <- leaf skills (loaded on demand)
 *
 * This 3-level structure mirrors Claude's progressive disclosure principle:
 * system prompt -> domain index -> specific library skill.
 *
 * Also includes domain lookup utilities for deriving domain from package name.
 */

import { Manifest, ManifestEntry, skillDirName } from "./types.js";

// ── Domain triggers type ─────────────────────────────────────────────

export type DomainTriggers = Record<string, string>;

// ── Group by domain ──────────────────────────────────────────────────

/** Groups manifest entries by domain. */
export function groupByDomain(entries: ManifestEntry[]): Map<string, ManifestEntry[]> {
  const map = new Map<string, ManifestEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.domain) ?? [];
    list.push(entry);
    map.set(entry.domain, list);
  }
  return map;
}

// ── Domain index generation ──────────────────────────────────────────

/**
 * Generates a domain-level index skill that lists all packages in that domain.
 * name field: "src-index-{domain}" -- valid kebab-case.
 */
export function generateDomainIndex(
  domain: string,
  entries: ManifestEntry[],
  triggers: DomainTriggers,
): string {
  const trigger  = triggers[domain] ?? `${domain} libraries`;
  const dirName  = `src-index-${domain}`;
  const rows     = entries
    .map(e => `| \`${skillDirName(e)}\` | ${e.description.slice(0, 80)}${e.description.length > 80 ? "..." : ""} |`)
    .join("\n");

  const pkgWord    = entries.length === 1 ? "package" : "packages";
  const description = `${entries.length} indexed ${domain}-domain ${pkgWord}. Use when ${trigger} and need to find the right source intel skill.`;

  return `---
name: "${dirName}"
description: "${description.slice(0, 1024)}"
---

# Source Intel: ${domain} domain (${entries.length} packages)

| Skill | Description |
|-------|-------------|
${rows}

## Quick Search

\`\`\`bash
cd opensrc-to-skill
${entries
  .slice(0, 3)
  .map(e => `npm run search "query" -- --pkg=${e.name} --limit=10`)
  .join("\n")}
\`\`\`
`;
}

// ── Master index generation ──────────────────────────────────────────

/**
 * Generates the master registry skill that lists all domains.
 * This is the entry point for skill discovery at scale.
 */
export function generateMasterIndex(
  manifest: Manifest,
  triggers: DomainTriggers,
): string {
  const byDomain = groupByDomain(manifest.repos);
  const total    = manifest.repos.length;
  const domains  = byDomain.size;

  const domainRows = [...byDomain.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domain, entries]) => {
      const trigger = (triggers[domain] ?? domain).slice(0, 60);
      return `| \`src-index-${domain}\` | ${entries.length} | ${trigger} |`;
    })
    .join("\n");

  const description =
    `Master index of ${total} indexed open-source packages across ${domains} domains. ` +
    `Use when looking for any library source intel skill, implementing features with open-source ` +
    `packages, or finding API patterns from indexed repos.`;

  return `---
name: "src-index"
description: "${description.slice(0, 1024)}"
---

# Source Intel Registry

${total} packages -- ${domains} domains -- FTS5 full-text search -- vector embeddings (optional)

## Domains

| Domain Index | Packages | Use When |
|--------------|----------|----------|
${domainRows}

## Direct Search

\`\`\`bash
cd opensrc-to-skill

# Search across all packages:
npm run search "<query>"

# Narrow to one package:
npm run search "<query>" -- --pkg=<name> --limit=20

# Hybrid FTS + cosine re-rank (requires embeddings):
npm run search "<query>" -- --pkg=<name> --mode=hybrid --limit=10
\`\`\`

## MCP (port 3742)

\`\`\`
opensrc.search  query="<query>"
opensrc.grep    pattern="<pattern>"  pkg="<name>"
opensrc.tree    pkg="<name>"
opensrc.read    pkg="<name>"   path="src/index.ts"
\`\`\`
`;
}

// ── Domain lookup ────────────────────────────────────────────────────

/** Minimal interface for domain lookup entries. */
export interface ManifestLike {
  name: string;
  domain: string;
  repo?: string;
}

/**
 * Look up domain for a package name.
 * Matches by entry.name or last segment of entry.repo.
 * Returns null if not found.
 */
export function lookupDomain(pkgName: string, entries: ManifestLike[]): string | null {
  const lower = pkgName.toLowerCase();
  for (const e of entries) {
    if (e.name.toLowerCase() === lower) return e.domain;
    if (e.repo) {
      const repoSegment = e.repo.split("/").pop()?.toLowerCase();
      if (repoSegment === lower) return e.domain;
    }
  }
  return null;
}
