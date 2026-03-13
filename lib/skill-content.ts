/**
 * Skill content generation -- Layer 2 (structural, offline).
 *
 * Produces compliant SKILL.md content following Anthropic's official spec:
 *   - name: kebab-case matching the skill directory (e.g. "src-nats")
 *   - description: "{what}. Use when {trigger}." -- trigger-first for discovery
 *   - 4-section progressive disclosure: Quick Start -> MCP -> Details -> Reference
 *   - Pre-populated search queries (never "<topic>" placeholders)
 */

import { ManifestEntry, PackageAnalysis, skillDirName } from "./types.js";
import { DOMAIN_TRIGGERS } from "./domains.js";
import { shellQuote } from "./guards.js";

// ── Name + description builders ────────────────────────────────────────

/**
 * Returns the YAML `name` value -- always equal to the skill directory name.
 * Guaranteed kebab-case, always < 64 chars.
 */
export function buildName(entry: ManifestEntry): string {
  return skillDirName(entry);
}

/**
 * Returns the YAML `description` value (max 1024 chars).
 *
 * Format: "{curated manifest description}. Use when {domain trigger}."
 * - Uses manifest description (keyword-dense, curated) not pkg.json (often generic)
 * - Trigger clause is front-loaded for autonomous skill selection
 * - Double quotes sanitized to single quotes to avoid YAML parse errors
 */
export function buildShortDescription(entry: ManifestEntry): string {
  const trigger  = DOMAIN_TRIGGERS[entry.domain] ?? "implementing features with this library";
  const what     = entry.description.trim().replace(/[.!?]$/, "");
  const full     = `${what}. Use when ${trigger}.`;
  return full.replace(/"/g, "'").slice(0, 1024);
}

// ── Term extraction for pre-populated search queries ──────────────────

const STOP_WORDS = new Set([
  "with", "from", "into", "that", "this", "when", "used", "using", "based",
  "support", "supports", "provides", "allows", "create", "creates", "manages",
  "returns", "takes", "builds", "local", "serve", "server", "client", "library",
  "package", "module", "source", "indexed", "search", "pattern", "option",
]);

export function extractKeyTerms(description: string): string[] {
  const terms: string[] = [];

  // CamelCase / PascalCase API names
  const pascal = description.match(/\b[A-Z][a-zA-Z0-9]{3,}\b/g) ?? [];
  terms.push(...pascal);

  // dot-notation identifiers (e.g. kv.put, jetstreamManager)
  const dotted = description.match(/\b[a-z][a-zA-Z0-9]+\.[a-zA-Z]+\b/g) ?? [];
  terms.push(...dotted);

  // hyphenated package names (e.g. better-sqlite3)
  const hyphenated = description.match(/\b[a-z]+-[a-z0-9-]+\b/g) ?? [];
  terms.push(...hyphenated.filter(t => t.length > 6));

  // long technical lowercase words
  for (const word of description.split(/[\s,\u2014\u2192/]+/)) {
    const clean = word.replace(/[^a-zA-Z0-9_]/g, "");
    if (clean.length >= 5 && !STOP_WORDS.has(clean.toLowerCase()) && /^[a-z]/.test(clean)) {
      terms.push(clean);
    }
  }

  return [...new Set(terms)].slice(0, 8);
}

// ── Search query + MCP query generation ───────────────────────────────

export function generateSearchQueries(entry: ManifestEntry, analysis: PackageAnalysis): string[] {
  const sourceText = entry.description.length >= analysis.description.length
    ? entry.description
    : `${entry.description} ${analysis.description}`;
  const terms = extractKeyTerms(sourceText);
  const pkg   = entry.name;
  const queries: string[] = [];

  if (terms.length >= 2) {
    queries.push(`# Core API patterns\nnpm run search "${terms[0]} ${terms[1]}" -- --pkg=${pkg} --limit=20`);
  }
  if (terms.length >= 4) {
    queries.push(`# Configuration\nnpm run search "${terms[2]} ${terms[3]} config" -- --pkg=${pkg} --limit=15`);
  }
  if (terms.length >= 6) {
    queries.push(`# Advanced patterns\nnpm run search "${terms[4]} ${terms[5]}" -- --pkg=${pkg} --limit=15`);
  }
  queries.push(
    `# Hybrid FTS+cosine (requires embeddings -- run \`just src-intel-embed\` once)\nnpm run search "${terms[0] ?? entry.name}" -- --pkg=${pkg} --mode=hybrid --limit=10`,
  );
  return queries;
}

export function generateMcpQueries(entry: ManifestEntry, analysis: PackageAnalysis): string {
  const sourceText = entry.description.length >= analysis.description.length
    ? entry.description
    : `${entry.description} ${analysis.description}`;
  const terms = extractKeyTerms(sourceText);
  const pkg   = entry.name;
  const t1    = terms.slice(0, 2).join("|") || entry.name;
  const t2    = terms.slice(2, 4).join("|") || terms[0] || entry.name;

  return [
    `opensrc.grep   pattern="${t1}"    pkg="${pkg}"`,
    `opensrc.grep   pattern="${t2}"    pkg="${pkg}"`,
    `opensrc.tree   pkg="${pkg}"`,
    `opensrc.read   pkg="${pkg}"   path="src/index.ts"`,
    `opensrc.astGrep pattern="export.*${terms[0] ?? "class"}"   pkg="${pkg}"`,
  ].join("\n");
}

// ── Structural SKILL.md template ───────────────────────────────────────

export function generateStructuralSkill(entry: ManifestEntry, analysis: PackageAnalysis): string {
  const name         = buildName(entry);
  const displayTitle = `Source Intel: ${analysis.pkgName}`;
  const description  = buildShortDescription(entry);
  const trigger      = DOMAIN_TRIGGERS[entry.domain] ?? "implementing features with this library";
  const pkg          = entry.name;
  const searchQueries = generateSearchQueries(entry, analysis).join("\n\n");
  const mcpQueries    = generateMcpQueries(entry, analysis);

  const keywordsLine = analysis.keywords.length > 0
    ? `- **Keywords:** ${analysis.keywords.join(", ")}`
    : "";

  const filesSection = analysis.mainFiles.length > 0
    ? `### Key Source Files\n${analysis.mainFiles.slice(0, 8).map(f => `- \`${f}\``).join("\n")}\n`
    : "";

  // Key Patterns section -- first code example from README
  const patternsSection = analysis.codeExamples.length > 0
    ? `\n---\n\n## Key Patterns\n\n> Full examples in [PATTERNS.md](references/PATTERNS.md).\n\n\`\`\`typescript\n${analysis.codeExamples[0]?.slice(0, 600) ?? ""}\n\`\`\`\n`
    : "";

  // API Surface section -- show 2 groups with the most symbols (skip tiny ones)
  const apiSection = analysis.exportGroups.length > 0
    ? (() => {
        const sorted  = [...analysis.exportGroups].sort((a, b) => b.symbols.length - a.symbols.length);
        const preview = sorted.slice(0, 2)
          .map(g => `// ${g.module}\n${g.symbols.slice(0, 8).join(", ")}`)
          .join("\n\n");
        const total = analysis.exportGroups.reduce((n, g) => n + g.symbols.length, 0);
        return `\n---\n\n## API Surface\n\n> Full symbol index in [API.md](references/API.md) -- ${total} exported symbols.\n\n\`\`\`typescript\n${preview}\n\`\`\`\n`;
      })()
    : "";

  const companionScripts = `- Search: \`./scripts/search.sh "<query>"\`
- Grep source: \`./scripts/grep.sh "<pattern>"\``;

  return `---
name: "${name}"
description: "${description}"
license: MIT
compatibility: "Requires Claude Code with opensrc MCP (port 3742). Node.js v18+. Optional: Ollama for semantic search."
allowed-tools: "Bash(npm:*) Bash(npx:*) Bash(node:*) mcp__opensrc__grep mcp__opensrc__search mcp__opensrc__read mcp__opensrc__tree mcp__opensrc__astGrep mcp__opensrc__fetch"
metadata:
  author: "@ruvnet/opensrc-to-skill"
  version: "1.0.0"
  domain: ${entry.domain}
  mcp-server: opensrc
  tags: [${analysis.keywords.slice(0, 5).map(k => k.replace(/[^a-zA-Z0-9-]/g, '')).join(', ')}]
  documentation: "https://github.com/ruvnet/opensrc-to-skill"
---

# ${displayTitle}

## Repo: \`${entry.repo}\`
${entry.description}${analysis.readmeExcerpt && analysis.readmeExcerpt !== entry.description.slice(0, analysis.readmeExcerpt.length) ? "\n\n" + analysis.readmeExcerpt : ""}

- GitHub: [${entry.repo}](${analysis.repoUrl})
- Local source: \`opensrc-to-skill/opensrc/repos/github.com/${entry.repo}/\`
- FTS index: \`opensrc-to-skill/agentdb.sqlite\` (pkg=\`${pkg}\`)
${patternsSection}${apiSection}
---

## Quick Start -- Search Commands

\`\`\`bash
cd opensrc-to-skill

${searchQueries}
\`\`\`

---

## Key MCP Queries

For agents using the opensrc MCP bridge (port 3742):
\`\`\`
${mcpQueries}
\`\`\`

---

## Package Details

- **Version:** ${analysis.version}${analysis.hasTypes ? " -- TypeScript types: Yes" : ""}
${keywordsLine}

${filesSection}

---

## Common Use Cases

Use this skill when **${trigger}**.

\`\`\`bash
npm run search "describe your need" -- --pkg=${pkg} --limit=20
\`\`\`

---

## Companion Files

| File | Purpose |
|------|---------|
| [references/PATTERNS.md](references/PATTERNS.md) | Code examples from README + usage recipes |
| [references/API.md](references/API.md) | Full exported symbol index |
| [scripts/search.sh](scripts/search.sh) | FTS keyword search |
| [scripts/grep.sh](scripts/grep.sh) | Grep repo source for pattern |

${companionScripts}

---

## Reference

- [GitHub: ${entry.repo}](${analysis.repoUrl})
- FTS search: \`cd opensrc-to-skill && npm run search "<query>" -- --pkg=${pkg}\`
- MCP bridge: port 3742, tools: \`opensrc.grep\` -- \`opensrc.tree\` -- \`opensrc.read\`
`;
}

// ── Companion file generators ──────────────────────────────────────────

/**
 * Generates PATTERNS.md -- README code examples + usage notes.
 * Returns null if no code examples are available.
 */
export function generatePatternsFile(entry: ManifestEntry, analysis: PackageAnalysis): string | null {
  if (analysis.codeExamples.length === 0) return null;

  const pkg   = entry.name;
  const lines = [
    `# Patterns: ${analysis.pkgName}`,
    "",
    `> Code examples extracted from \`${entry.repo}\` README.`,
    `> Run \`./scripts/search.sh "<query>"\` to search 1000s more patterns from the full source.`,
    "",
  ];

  analysis.codeExamples.forEach((block, i) => {
    lines.push(`## Example ${i + 1}`);
    lines.push("");
    lines.push("```typescript");
    lines.push(block);
    lines.push("```");
    lines.push("");
  });

  lines.push("## Search for More Patterns");
  lines.push("");
  lines.push("```bash");
  lines.push("cd opensrc-to-skill");
  lines.push(`npm run search "pattern or concept" -- --pkg=${pkg} --limit=20`);
  lines.push(`npm run search "pattern or concept" -- --pkg=${pkg} --mode=hybrid --limit=10`);
  lines.push("```");

  return lines.join("\n");
}

/**
 * Generates API.md -- full exported symbol index grouped by source module.
 * Returns null if no export groups were found.
 */
export function generateApiFile(entry: ManifestEntry, analysis: PackageAnalysis): string | null {
  if (analysis.exportGroups.length === 0) return null;

  const pkg   = entry.name;
  const total = analysis.exportGroups.reduce((n, g) => n + g.symbols.length, 0);
  const lines = [
    `# API: ${analysis.pkgName}`,
    "",
    `${total} exported symbols from \`${entry.repo}\`.`,
    "",
    `| Module | Symbols |`,
    `|--------|---------|`,
  ];

  for (const { module, symbols } of analysis.exportGroups) {
    lines.push(`| \`${module}\` | ${symbols.length} |`);
  }

  lines.push("");
  for (const { module, symbols } of analysis.exportGroups) {
    lines.push(`## \`${module}\``);
    lines.push("");
    lines.push("```typescript");
    lines.push(symbols.join(", "));
    lines.push("```");
    lines.push("");
  }

  lines.push("## Find Implementation");
  lines.push("");
  lines.push("```bash");
  lines.push("cd opensrc-to-skill");
  lines.push(`npm run search "SymbolName" -- --pkg=${pkg} --limit=10`);
  lines.push(`./scripts/grep.sh "SymbolName"   # from skill directory`);
  lines.push("```");

  return lines.join("\n");
}

// ── Companion scripts ──────────────────────────────────────────────────

/** Generates scripts/search.sh */
export function generateSearchScript(entry: ManifestEntry): string {
  const quotedName = shellQuote(entry.name);
  const quotedRepo = shellQuote(entry.repo);
  return `#!/usr/bin/env bash
# Search ${quotedRepo} source chunks in the local FTS index.
# Usage: ./scripts/search.sh "<query>" [limit]
set -euo pipefail

QUERY="\${1:?Usage: $0 <query> [limit]}"
LIMIT="\${2:-20}"
PKG=${quotedName}

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

for CANDIDATE in \\
  "\${SCRIPT_DIR}/../../../opensrc-to-skill" \\
  "\${SCRIPT_DIR}/../../../../opensrc-to-skill" \\
  "opensrc-to-skill"; do
  if [[ -d "\$CANDIDATE" ]]; then
    INTEL_DIR="\$(cd "\$CANDIDATE" && pwd)"
    break
  fi
done

if [[ -z "\${INTEL_DIR:-}" ]]; then
  echo "ERROR: could not find opensrc-to-skill directory" >&2
  exit 1
fi

cd "\$INTEL_DIR"
npm run search "\$QUERY" -- --pkg="\$PKG" --limit="\$LIMIT"
`;
}

/** Generates scripts/grep.sh -- grep the cloned repo source for a pattern. */
export function generateGrepScript(entry: ManifestEntry): string {
  const quotedRepo = shellQuote(entry.repo);
  return `#!/usr/bin/env bash
# Grep ${quotedRepo} source for a regex pattern.
# Usage: ./scripts/grep.sh <pattern> [--include=*.ts]
set -euo pipefail

PATTERN="\${1:?Usage: $0 <pattern> [--include=*.ts]}"
INCLUDE="\${2:---include=*.ts}"
REPO_SUBPATH=${quotedRepo}

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

for CANDIDATE in \\
  "\${SCRIPT_DIR}/../../../opensrc-to-skill" \\
  "\${SCRIPT_DIR}/../../../../opensrc-to-skill" \\
  "opensrc-to-skill"; do
  if [[ -d "\$CANDIDATE" ]]; then
    REPO_DIR="\$CANDIDATE/opensrc/repos/github.com/\$REPO_SUBPATH"
    break
  fi
done

if [[ -z "\${REPO_DIR:-}" ]] || [[ ! -d "\$REPO_DIR" ]]; then
  echo "ERROR: could not find repo at opensrc/repos/github.com/\$REPO_SUBPATH" >&2
  exit 1
fi

grep -r "\$PATTERN" "\$REPO_DIR" \$INCLUDE --color=auto -n 2>/dev/null | head -60
`;
}
