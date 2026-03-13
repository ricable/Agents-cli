/**
 * cli-anything/doc-generator.ts — Phase 6 (Document).
 *
 * Generates README.md, CHANGELOG, and references/ for a CLI harness.
 */

import type { AppProfile, HarnessDesign, HarnessBundle, DocBundle, QualityGate6Axis } from "./types.js";

/**
 * Generate documentation bundle for a harness.
 */
export function documentHarness(
  profile: AppProfile,
  design: HarnessDesign,
  _bundle: HarnessBundle,
  quality?: QualityGate6Axis,
): DocBundle {
  const readme = generateFullReadme(profile, design, quality);
  const changelog = generateChangelog(profile, design);
  const references: Record<string, string> = {};

  // Command reference
  references["references/commands.md"] = generateCommandRef(design);

  // API coverage
  references["references/api-coverage.md"] = generateApiCoverage(profile, design);

  // Examples
  references["references/examples.md"] = generateExamples(profile, design);

  // Troubleshooting
  references["references/troubleshooting.md"] = generateTroubleshooting(profile);

  return { readme, changelog, references };
}

function generateFullReadme(
  profile: AppProfile,
  design: HarnessDesign,
  quality?: QualityGate6Axis,
): string {
  const qualityBadge = quality?.passed ? "PASS" : "PENDING";
  const groups = design.groups.map(g =>
    `| \`${g}\` | ${design.commands.filter(c => c.group === g).length} commands |`
  ).join("\n");

  return `# ${design.packageName}

> Agent-native CLI wrapper for **${profile.displayName}** | Quality: ${qualityBadge}

## Quick Start

\`\`\`bash
# Install
uv pip install -e .

# Verify
${design.packageName} --version
${design.packageName} --help

# JSON mode (for AI agents)
${design.packageName} --json ${design.groups[0] ?? ""} list
\`\`\`

## Command Groups

| Group | Commands |
|-------|----------|
${groups}

## JSON Output

Every command supports \`--json\` for structured output:

\`\`\`json
{
  "ok": true,
  "command": "${design.groups[0] ?? "example"}-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
\`\`\`

## Backend

- **Type:** ${profile.backendType}
- **Bindings:** ${profile.bindings.join(", ") || "none"}
- **Scriptable:** ${profile.scriptable ? "Yes" : "No"}
${profile.installed ? `- **Binary:** \`${profile.binaryPath}\`` : `- **Install:** \`${profile.installHint}\``}

## Testing

\`\`\`bash
pytest tests/ -v
pytest tests/ -m unit        # Unit tests only (no app needed)
pytest tests/ -m integration # Requires ${profile.displayName}
\`\`\`

## License

MIT
`;
}

function generateChangelog(profile: AppProfile, design: HarnessDesign): string {
  return `# Changelog

## 0.1.0 — Initial Release

- ${design.commands.length} commands across ${design.groups.length} groups
- Click-based CLI with \`--json\` structured output
- ${profile.backendType} backend for ${profile.displayName}
- Pytest suite with unit + integration tests
- cli-anything-core dependency for shared REPL, output, testing
`;
}

function generateCommandRef(design: HarnessDesign): string {
  const sections = design.groups.map(group => {
    const cmds = design.commands.filter(c => c.group === group);
    const cmdDocs = cmds.map(cmd => {
      const args = cmd.args.map(a =>
        `  - \`${a.required ? a.name : "--" + a.name}\` (${a.type}${a.required ? ", required" : ""}) — ${a.description}`
      ).join("\n");
      return `### \`${cmd.name}\`

${cmd.description}

**Arguments:**
${args || "  None"}
`;
    }).join("\n");

    return `## ${group}

${cmdDocs}`;
  }).join("\n---\n\n");

  return `# Command Reference — ${design.packageName}

${sections}`;
}

function generateApiCoverage(profile: AppProfile, design: HarnessDesign): string {
  const totalApi = profile.apiSurface.length;
  const implemented = design.commands.length;
  const coverage = totalApi > 0 ? Math.round((implemented / totalApi) * 100) : 0;

  const byGroup = design.groups.map((g: string) => {
    const apiCount = profile.apiSurface.filter((e: { group: string }) => e.group === g).length;
    const cmdCount = design.commands.filter(c => c.group === g).length;
    return `| ${g} | ${cmdCount}/${apiCount} | ${apiCount > 0 ? Math.round((cmdCount / apiCount) * 100) : 0}% |`;
  }).join("\n");

  return `# API Coverage — ${design.packageName}

**Overall:** ${implemented}/${totalApi} endpoints (${coverage}%)

| Group | Covered | % |
|-------|---------|---|
${byGroup}
`;
}

function generateExamples(_profile: AppProfile, design: HarnessDesign): string {
  const examples = design.groups.slice(0, 3).map(group => {
    return `## ${group}

\`\`\`bash
# List ${group} items
${design.packageName} --json ${group} list

# Create a new ${group} item
${design.packageName} --json ${group} create
\`\`\``;
  }).join("\n\n");

  return `# Examples — ${design.packageName}

${examples}
`;
}

function generateTroubleshooting(profile: AppProfile): string {
  return `# Troubleshooting — cli-anything-${profile.name}

## ${profile.displayName} Not Found

If you see "Binary not found" errors:

\`\`\`bash
${profile.installHint}
\`\`\`

## Python Bindings Missing

Install required bindings:

\`\`\`bash
uv pip install ${profile.bindings.join(" ") || profile.name}
\`\`\`

## JSON Output Issues

All commands support \`--json\`. If output is not valid JSON, check:
1. The command completed successfully (exit code 0)
2. No extra print statements in custom backends
3. stderr is separate from stdout

## Backend Connection Issues

${profile.backendType === "rest-api"
    ? "Ensure the API server is running and accessible."
    : profile.backendType === "python-binding"
      ? "Verify Python bindings are importable: `python -c 'import " + (profile.bindings[0]?.replace(/-/g, "_") ?? profile.name) + "'`"
      : "Verify the binary is in PATH: `which " + profile.name + "`"
  }
`;
}
