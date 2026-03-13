/**
 * cli-anything/publisher.ts — Phase 7 (Publish).
 *
 * Generates SKILL.md, registers in store + MCP, optionally builds
 * plugin, hooks, and agent definitions.
 */

import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import type {
  AppProfile,
  HarnessDesign,
  HarnessBundle,
  TestPlan,
  DocBundle,
  QualityGate6Axis,
  PublishResult,
} from "./types.js";

/**
 * Publish a CLI-Anything harness: generate SKILL.md, register, build plugin.
 */
export function publishHarness(opts: {
  profile: AppProfile;
  design: HarnessDesign;
  bundle: HarnessBundle;
  testPlan: TestPlan;
  docs: DocBundle;
  quality: QualityGate6Axis;
  outputDir: string;
  dryRun: boolean;
}): PublishResult {
  const { profile, design, bundle, testPlan, docs, quality, outputDir, dryRun } = opts;
  const skillDir = join(outputDir, design.packageName);

  // Generate SKILL.md
  const skillMd = generateCliAnythingSkillMd(profile, design, testPlan, quality);

  if (dryRun) {
    return {
      skillMd,
      skillDir,
      mcpRegistered: false,
      storeRegistered: false,
    };
  }

  // Write skill directory
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), skillMd, "utf-8");

  // Write references
  const refsDir = join(skillDir, "references");
  mkdirSync(refsDir, { recursive: true });
  for (const [path, content] of Object.entries(docs.references)) {
    const fullPath = join(skillDir, path);
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
  }

  // Write harness files
  const harnessDir = join(outputDir, `${design.packageName}-harness`);
  mkdirSync(harnessDir, { recursive: true });
  for (const file of bundle.files) {
    const fullPath = join(harnessDir, file.path);
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, file.content, "utf-8");
  }

  return {
    skillMd,
    skillDir,
    mcpRegistered: false,
    storeRegistered: false,
  };
}

/**
 * Generate SKILL.md for a CLI-Anything harness.
 */
function generateCliAnythingSkillMd(
  profile: AppProfile,
  design: HarnessDesign,
  testPlan: TestPlan,
  quality: QualityGate6Axis,
): string {
  const groups = design.groups;
  const cmdCount = design.commands.length;
  const groupList = groups.join(", ");

  // Build description with trigger score optimization
  const description = buildCliAnythingDescription(profile, design);

  // Build ingredients (bindings + core)
  const ingredients = [
    "cli-anything-core",
    ...profile.bindings.slice(0, 5),
  ].map(i => `  - ${i}`).join("\n");

  // Build tags
  const tags = [
    profile.category,
    profile.backendType,
    "cli-wrapper",
    "agent-native",
    profile.name,
  ].map(t => `  - ${t}`).join("\n");

  // Command quick ref
  const quickRef = groups.slice(0, 5).map(g =>
    `### ${g}\n\n\`\`\`bash\n${design.packageName} --json ${g} list\n${design.packageName} --json ${g} create\n\`\`\``
  ).join("\n\n");

  return `---
name: ${design.packageName}
description: "${description}"
version: 0.1.0
domain: ${profile.category === "creative" ? "creative-tools" : profile.category === "office" ? "office-tools" : profile.category}
ingredients:
${ingredients}
tags:
${tags}
allowed-tools:
  - ${design.packageName}
compatibility: "Python >=3.10, Click >=8.0"
context: "CLI-Anything harness for ${profile.displayName}. ${cmdCount} commands across ${groups.length} groups: ${groupList}. Backend: ${profile.backendType}. All commands support --json for structured output."
argument-hint: "${design.packageName} --json <group> <command> [args]"
---

# ${design.packageName}

Agent-native CLI wrapper for **${profile.displayName}** with structured JSON output.
${profile.installed ? `Detected at: \`${profile.binaryPath}\`` : `Install: \`${profile.installHint}\``}

## Quick Start

\`\`\`bash
# Install harness
uv pip install -e .

# Verify
${design.packageName} --version
${design.packageName} --help

# JSON mode
${design.packageName} --json ${groups[0] ?? "help"} list
\`\`\`

## Commands

${quickRef}

## JSON Output Format

\`\`\`json
{
  "ok": true,
  "command": "${groups[0] ?? "example"}-list",
  "data": { "items": [], "count": 0 },
  "meta": { "version": "0.1.0", "duration": 0.05, "timestamp": "..." }
}
\`\`\`

## Testing (${testPlan.totalCount} tests)

\`\`\`bash
pytest tests/ -v                  # All ${testPlan.totalCount} tests
pytest tests/ -m unit             # Unit only (no app needed)
pytest tests/ -m integration      # Requires ${profile.displayName}
\`\`\`

## Quality Gate

Overall: ${quality.overall}/100 (${quality.passed ? "PASS" : "FAIL"})

| Axis | Score | Threshold |
|------|-------|-----------|
${quality.axes.map(a => `| ${a.axis} | ${a.score} | ${a.threshold} |`).join("\n")}
`;
}

/**
 * Build a trigger-optimized description for CLI-Anything skills.
 */
function buildCliAnythingDescription(profile: AppProfile, design: HarnessDesign): string {
  const actions = design.groups.slice(0, 3).map(g => {
    switch (g) {
      case "project": return "managing projects";
      case "image": case "layer": return "editing images and layers";
      case "filter": return "applying filters and effects";
      case "scene": return "managing 3D scenes";
      case "render": return "rendering and exporting";
      case "document": return "editing documents";
      case "track": return "managing audio tracks";
      case "effect": return "applying effects";
      case "meeting": return "scheduling meetings";
      case "diagram": return "creating diagrams";
      default: return `managing ${g}`;
    }
  });

  const actionStr = actions.join(", ");
  const techNames = [profile.displayName, ...profile.bindings.slice(0, 2)].join(", ");

  return `Use when ${actionStr} in ${profile.displayName}. Do NOT use for manual GUI interaction or unsupported ${profile.displayName} plugins. Wraps ${techNames} via ${profile.backendType} backend.`;
}
