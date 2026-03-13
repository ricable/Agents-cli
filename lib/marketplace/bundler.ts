/**
 * marketplace/bundler.ts — Bundle CLI-Anything harness outputs into marketplace-ready packages.
 *
 * Creates one bundle per product type (skill, plugin, hook-bundle, agent-def, agent-team).
 * Also supports suite bundles combining multiple app harnesses.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { CliAnythingResult } from "../cli-anything/types.js";
import type { ProductType } from "./types.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface BundleManifest {
  id: string;
  name: string;
  version: string;
  productType: ProductType;
  contents: string[];
  checksum: string;
  createdAt: string;
}

export interface BundleOpts {
  result: CliAnythingResult;
  outputDir: string;
  includeSkill: boolean;
  includePlugin: boolean;
  includeHooks: boolean;
  includeAgents: boolean;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Bundle a CLI-Anything result into marketplace-ready packages.
 * Creates one bundle per product type that the result contains.
 */
export function bundleForMarketplace(opts: BundleOpts): BundleManifest[] {
  const { result, outputDir, includeSkill, includePlugin, includeHooks, includeAgents } = opts;
  const manifests: BundleManifest[] = [];
  const pkgName = result.design.packageName;
  const now = new Date().toISOString();

  fs.mkdirSync(outputDir, { recursive: true });

  // 1. Harness bundle (always included — it's the core product)
  const harnessDir = path.join(outputDir, `${pkgName}-harness`);
  fs.mkdirSync(harnessDir, { recursive: true });
  const harnessFiles: string[] = [];
  for (const file of result.bundle.files) {
    const filePath = path.join(harnessDir, file.path);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, file.content, "utf-8");
    harnessFiles.push(file.path);
  }
  manifests.push({
    id: `${pkgName}-harness`,
    name: `${result.profile.displayName} CLI Harness`,
    version: "0.1.0",
    productType: "harness",
    contents: harnessFiles,
    checksum: computeBundleChecksum(harnessDir),
    createdAt: now,
  });

  // 2. Skill bundle
  if (includeSkill && result.published.skillMd) {
    const skillDir = path.join(outputDir, `${pkgName}-skill`);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), result.published.skillMd, "utf-8");

    const skillContents = ["SKILL.md"];

    // Copy references from docs if available
    if (result.docs.references) {
      const refsDir = path.join(skillDir, "references");
      fs.mkdirSync(refsDir, { recursive: true });
      for (const [refPath, content] of Object.entries(result.docs.references)) {
        const basename = path.basename(refPath);
        fs.writeFileSync(path.join(refsDir, basename), content, "utf-8");
        skillContents.push(`references/${basename}`);
      }
    }

    manifests.push({
      id: `${pkgName}-skill`,
      name: `${result.profile.displayName} Skill`,
      version: "0.1.0",
      productType: "skill",
      contents: skillContents,
      checksum: computeBundleChecksum(skillDir),
      createdAt: now,
    });
  }

  // 3. Plugin bundle
  if (includePlugin) {
    const pluginDir = path.join(outputDir, `${pkgName}-plugin`);
    const metaDir = path.join(pluginDir, ".claude-plugin");
    const skillsDir = path.join(pluginDir, "skills", pkgName);
    const commandsDir = path.join(pluginDir, "commands");

    fs.mkdirSync(metaDir, { recursive: true });
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.mkdirSync(commandsDir, { recursive: true });

    // Write plugin.json
    const pluginManifest = {
      name: pkgName,
      version: "1.0.0",
      description: `Claude Code plugin for ${result.profile.displayName} — ${result.design.commands.length} commands, ${result.design.groups.length} groups`,
      keywords: [result.profile.category, result.profile.backendType, "cli-anything", result.profile.name],
      license: "MIT",
    };
    fs.writeFileSync(path.join(metaDir, "plugin.json"), JSON.stringify(pluginManifest, null, 2) + "\n", "utf-8");

    // Copy SKILL.md into plugin
    if (result.published.skillMd) {
      fs.writeFileSync(path.join(skillsDir, "SKILL.md"), result.published.skillMd, "utf-8");
    }

    // Generate search command
    const searchCmd = [
      "---",
      `description: Search ${result.profile.displayName} commands and documentation.`,
      "---",
      "",
      `Search ${result.profile.displayName} tools for "$ARGUMENTS".`,
      "",
      `Available groups: ${result.design.groups.join(", ")}`,
      "",
    ].join("\n");
    fs.writeFileSync(path.join(commandsDir, "search.md"), searchCmd, "utf-8");

    const pluginContents = [
      ".claude-plugin/plugin.json",
      `skills/${pkgName}/SKILL.md`,
      "commands/search.md",
    ];

    manifests.push({
      id: `${pkgName}-plugin`,
      name: `${result.profile.displayName} Plugin`,
      version: "1.0.0",
      productType: "plugin",
      contents: pluginContents,
      checksum: computeBundleChecksum(pluginDir),
      createdAt: now,
    });
  }

  // 4. Hook bundle
  if (includeHooks) {
    const hooksDir = path.join(outputDir, `${pkgName}-hooks`);
    fs.mkdirSync(hooksDir, { recursive: true });

    const category = result.profile.category;
    const hooksJson = {
      hooks: [
        {
          event: "PreToolUse",
          pattern: pkgName,
          command: `echo "Pre-check: validating ${result.profile.displayName} state"`,
        },
        {
          event: "PostToolUse",
          pattern: pkgName,
          command: `echo "Post-check: ${result.profile.displayName} operation complete"`,
        },
        {
          event: "SessionStart",
          command: `echo "Loading ${category} domain context for ${result.profile.displayName}"`,
        },
      ],
    };
    fs.writeFileSync(path.join(hooksDir, "hooks.json"), JSON.stringify(hooksJson, null, 2) + "\n", "utf-8");

    manifests.push({
      id: `${pkgName}-hooks`,
      name: `${result.profile.displayName} Hooks`,
      version: "1.0.0",
      productType: "hook-bundle",
      contents: ["hooks.json"],
      checksum: computeBundleChecksum(hooksDir),
      createdAt: now,
    });
  }

  // 5. Agent definition bundle
  if (includeAgents) {
    const agentDir = path.join(outputDir, `${pkgName}-agents`);
    fs.mkdirSync(agentDir, { recursive: true });

    const agentContents: string[] = [];

    // Primary expert agent
    const expertMd = generateAgentMd(
      `${pkgName}-expert`,
      `${result.profile.displayName} Expert`,
      result.profile,
      result.design,
      "sonnet",
    );
    fs.writeFileSync(path.join(agentDir, `${pkgName}-expert.md`), expertMd, "utf-8");
    agentContents.push(`${pkgName}-expert.md`);

    // Specialist worker agent (for the primary group)
    if (result.design.groups.length > 0) {
      const primaryGroup = result.design.groups[0]!;
      const workerName = `${pkgName}-${primaryGroup}-worker`;
      const workerMd = generateWorkerAgentMd(
        workerName,
        primaryGroup,
        result.profile,
        result.design,
      );
      fs.writeFileSync(path.join(agentDir, `${workerName}.md`), workerMd, "utf-8");
      agentContents.push(`${workerName}.md`);
    }

    manifests.push({
      id: `${pkgName}-agents`,
      name: `${result.profile.displayName} Agent Definitions`,
      version: "1.0.0",
      productType: "agent-def",
      contents: agentContents,
      checksum: computeBundleChecksum(agentDir),
      createdAt: now,
    });
  }

  // Write bundle index
  const indexPath = path.join(outputDir, "bundles.json");
  fs.writeFileSync(indexPath, JSON.stringify(manifests, null, 2) + "\n", "utf-8");

  return manifests;
}

/**
 * Create a suite bundle combining multiple app harnesses.
 * E.g., "Creative Suite" = GIMP + Blender + Inkscape bundles.
 */
export function createSuiteBundle(opts: {
  name: string;
  description: string;
  appResults: CliAnythingResult[];
  outputDir: string;
  pricing?: { price: number; currency: string };
}): BundleManifest {
  const { name, description, appResults, outputDir } = opts;
  const now = new Date().toISOString();
  const suiteId = name.toLowerCase().replace(/\s+/g, "-");
  const suiteDir = path.join(outputDir, suiteId);

  fs.mkdirSync(suiteDir, { recursive: true });

  const contents: string[] = [];
  const appNames: string[] = [];

  // Bundle each app result
  for (const result of appResults) {
    const pkgName = result.design.packageName;
    appNames.push(result.profile.displayName);

    const appDir = path.join(suiteDir, pkgName);
    fs.mkdirSync(appDir, { recursive: true });

    // Include harness files
    for (const file of result.bundle.files) {
      const filePath = path.join(appDir, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, file.content, "utf-8");
    }

    // Include SKILL.md
    if (result.published.skillMd) {
      fs.writeFileSync(path.join(appDir, "SKILL.md"), result.published.skillMd, "utf-8");
      contents.push(`${pkgName}/SKILL.md`);
    }
  }

  // Generate suite-level SKILL.md
  const suiteSkillMd = generateSuiteSkillMd(name, description, appResults);
  fs.writeFileSync(path.join(suiteDir, "SKILL.md"), suiteSkillMd, "utf-8");
  contents.push("SKILL.md");

  // Generate suite-level README
  const readme = generateSuiteReadme(name, description, appResults);
  fs.writeFileSync(path.join(suiteDir, "README.md"), readme, "utf-8");
  contents.push("README.md");

  // Generate cross-app agent team definition
  const teamDir = path.join(suiteDir, "agents");
  fs.mkdirSync(teamDir, { recursive: true });
  const teamMd = generateSuiteTeamMd(name, appResults);
  fs.writeFileSync(path.join(teamDir, `${suiteId}-team.md`), teamMd, "utf-8");
  contents.push(`agents/${suiteId}-team.md`);

  // Write suite index
  const manifest: BundleManifest = {
    id: suiteId,
    name,
    version: "1.0.0",
    productType: "agent-team",
    contents,
    checksum: computeBundleChecksum(suiteDir),
    createdAt: now,
  };

  fs.writeFileSync(
    path.join(suiteDir, "bundle.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8",
  );

  return manifest;
}

/**
 * Compute SHA-256 checksum of a directory's contents.
 */
export function computeBundleChecksum(dir: string): string {
  const hash = createHash("sha256");
  hashDirectoryContents(dir, hash, dir);
  return hash.digest("hex");
}

// ── Helpers ────────────────────────────────────────────────────────────

function hashDirectoryContents(
  dir: string,
  hash: ReturnType<typeof createHash>,
  baseDir: string,
): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    // Skip generated index files
    if (entry.name === "bundles.json" || entry.name === "bundle.json") continue;

    if (entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      hashDirectoryContents(fullPath, hash, baseDir);
    } else if (entry.isFile()) {
      hash.update(relativePath);
      hash.update(fs.readFileSync(fullPath));
    }
  }
}

function generateAgentMd(
  name: string,
  displayName: string,
  profile: import("../cli-anything/types.js").AppProfile,
  design: import("../cli-anything/types.js").HarnessDesign,
  model: string,
): string {
  const groups = design.groups.join(", ");
  return [
    "---",
    `name: ${name}`,
    `description: "${displayName} expert agent. Use when automating ${profile.displayName} workflows across ${groups}."`,
    `model: ${model}`,
    `maxTurns: 10`,
    "---",
    "",
    `You are a specialized ${profile.displayName} automation agent.`,
    "",
    "## Capabilities",
    "",
    `- ${design.commands.length} commands across ${design.groups.length} groups: ${groups}`,
    `- Backend: ${profile.backendType}`,
    `- All output is structured JSON`,
    "",
    "## Rules",
    "",
    `- Always use \`${design.packageName} --json\` for structured output`,
    "- Verify the app is running before executing commands",
    "- Use --dry-run when available for destructive operations",
    "- Report errors with full JSON response",
    "",
  ].join("\n");
}

function generateWorkerAgentMd(
  name: string,
  group: string,
  profile: import("../cli-anything/types.js").AppProfile,
  design: import("../cli-anything/types.js").HarnessDesign,
): string {
  const groupCmds = design.commands.filter(c => c.group === group);
  const cmdList = groupCmds.slice(0, 5).map(c => `- \`${c.name}\`: ${c.description}`).join("\n");

  return [
    "---",
    `name: ${name}`,
    `description: "Specialist for ${group} operations in ${profile.displayName}."`,
    `model: haiku`,
    `maxTurns: 3`,
    "---",
    "",
    `You are a specialized ${group} worker for ${profile.displayName}.`,
    "",
    "## Available Commands",
    "",
    cmdList || `- All \`${group}\` subcommands`,
    "",
    "## Constraints",
    "",
    `- Focus only on ${group} operations`,
    "- Complete work within 3 turns",
    "- Return structured JSON results",
    "",
  ].join("\n");
}

function generateSuiteSkillMd(
  name: string,
  description: string,
  results: CliAnythingResult[],
): string {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const appNames = results.map(r => r.profile.displayName);
  const totalCmds = results.reduce((sum, r) => sum + r.design.commands.length, 0);
  const appList = appNames.join(", ");

  return [
    "---",
    `name: ${slug}`,
    `description: "Use when orchestrating ${appList} workflows together. Do NOT use for single-app tasks. Suite with ${totalCmds} commands across ${results.length} apps."`,
    "version: 1.0.0",
    `domain: ${results[0]?.profile.category ?? "generic"}`,
    "tags:",
    "  - suite",
    "  - multi-app",
    ...appNames.map(n => `  - ${n.toLowerCase()}`),
    "context: fork",
    'allowed-tools: "Read,Grep,Glob,Bash,Agent"',
    "---",
    "",
    `# ${name}`,
    "",
    description,
    "",
    "## Included Apps",
    "",
    ...results.map(r => `- **${r.profile.displayName}** (\`${r.design.packageName}\`): ${r.design.commands.length} commands`),
    "",
    "## Quick Start",
    "",
    "```bash",
    ...results.map(r => `${r.design.packageName} --json help`),
    "```",
    "",
    "## Cross-App Workflows",
    "",
    `This suite enables workflows that span ${appList}.`,
    "Use the suite team agent to orchestrate multi-app tasks.",
    "",
  ].join("\n");
}

function generateSuiteReadme(
  name: string,
  description: string,
  results: CliAnythingResult[],
): string {
  const totalCmds = results.reduce((sum, r) => sum + r.design.commands.length, 0);
  const totalTests = results.reduce((sum, r) => sum + r.testPlan.totalCount, 0);

  return [
    `# ${name}`,
    "",
    description,
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Apps | ${results.length} |`,
    `| Total Commands | ${totalCmds} |`,
    `| Total Tests | ${totalTests} |`,
    "",
    "## Apps",
    "",
    ...results.map(r => [
      `### ${r.profile.displayName}`,
      "",
      `- Package: \`${r.design.packageName}\``,
      `- Commands: ${r.design.commands.length}`,
      `- Groups: ${r.design.groups.join(", ")}`,
      `- Backend: ${r.profile.backendType}`,
      `- Quality: ${r.quality.overall}/100`,
      "",
    ].join("\n")),
    "## Installation",
    "",
    "```bash",
    ...results.map(r => `uv pip install -e ${r.design.packageName}/`),
    "```",
    "",
  ].join("\n");
}

function generateSuiteTeamMd(
  name: string,
  results: CliAnythingResult[],
): string {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const appNames = results.map(r => r.profile.displayName);

  return [
    "---",
    `name: ${slug}-team`,
    `description: "Cross-app team agent for ${name}. Orchestrates ${appNames.join(", ")} together."`,
    "model: sonnet",
    "maxTurns: 15",
    "---",
    "",
    `You are the orchestrator for the ${name} agent team.`,
    "",
    "## Team Members",
    "",
    ...results.map(r => `- **${r.design.packageName}-expert**: Handles ${r.profile.displayName} operations`),
    "",
    "## Workflow",
    "",
    "1. Parse the user's task and identify which apps are needed",
    "2. Spawn the appropriate expert agents using the Agent tool",
    "3. Coordinate data flow between apps (e.g., render in Blender, post-process in GIMP)",
    "4. Collect results and produce a unified report",
    "",
    "## Rules",
    "",
    "- Only spawn agents for apps that are relevant to the task",
    "- Pass data between agents via file paths, not raw content",
    "- Verify each agent's output before passing to the next",
    "- Report the full pipeline status at completion",
    "",
  ].join("\n");
}
