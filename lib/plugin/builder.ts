/**
 * plugin-builder: Build Claude Code plugin packages per domain.
 *
 * Produces self-contained plugins that conform to the official Claude Code
 * plugin specification (https://code.claude.com/docs/en/plugins-reference):
 *
 *   my-plugin/
 *   ├── .claude-plugin/
 *   │   └── plugin.json       ← manifest (official schema fields only)
 *   ├── skills/
 *   │   └── <name>/SKILL.md   ← copied from generated-skills/
 *   ├── agents/
 *   │   └── <name>.md         ← markdown with YAML frontmatter
 *   ├── commands/
 *   │   └── search.md         ← user-invokable slash commands
 *   └── hooks/                ← optional
 *       └── hooks.json
 */

import fs from "node:fs";
import path from "node:path";
import { generateAgentMarkdown, defaultAgentMarkdown } from "./ai-generator.js";
import { assertWithinDir, validatePluginName } from "./shared.js";
import type { ManifestEntry } from "../types.js";

// ── Official plugin.json schema (Claude Code spec-compliant) ───────────

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: { name: string; email?: string; url?: string };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
}

/** @deprecated Use PluginManifest instead */
export type PluginJson = PluginManifest;

export interface BuildPluginsOptions {
  /** Only build the plugin for this domain (optional) */
  domain?: string;
  /** Use Claude Haiku to generate agent definitions */
  aiGenerate?: boolean;
  /** Root directory containing skills-manifest.json and plugins/ output */
  rootDir?: string;
  /** Path to the manifest file (overrides rootDir-based discovery) */
  manifestPath?: string;
  /** Output directory for plugins (overrides rootDir/plugins) */
  pluginsDir?: string;
  /** Directory containing generated skills (for copying into plugins) */
  skillsSourceDir?: string;
  /** Dry-run mode — preview without writing */
  dryRun?: boolean;
}

export interface BuildPluginsResult {
  pluginCount: number;
  skillsCopied: number;
  domains: string[];
}

interface Manifest {
  repos: ManifestEntry[];
}

// ── Domain → human-readable descriptions ───────────────────────────────

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  "agent": "AI agent tools for orchestrating multi-agent workflows, spawning workers, and managing agent lifecycle",
  "ai-ml": "Machine learning and AI tools for training models, running inference, and building ML pipelines",
  "browser": "Browser automation tools for web scraping, testing, and headless browser control",
  "cloud": "Cloud infrastructure tools for deploying, managing, and monitoring cloud resources",
  "code-search": "Code search and analysis tools for finding patterns, counting lines, and navigating codebases",
  "database": "Database tools for querying, migrating, and managing SQL/NoSQL databases with ORMs",
  "devops": "DevOps tools for CI/CD, container orchestration, infrastructure-as-code, and deployment",
  "documentation": "Documentation tools for generating, building, and publishing project docs",
  "file-processing": "File processing tools for converting, transforming, and manipulating files and data",
  "git": "Git tools for version control workflows, repository management, and code review",
  "http-api": "HTTP and API tools for making requests, testing endpoints, and building APIs",
  "javascript": "JavaScript ecosystem tools for bundling, linting, formatting, and package management",
  "monitoring": "Monitoring tools for metrics collection, alerting, log analysis, and observability",
  "network": "Network tools for traffic analysis, DNS, proxying, and connectivity diagnostics",
  "python": "Python ecosystem tools for package management, linting, formatting, and virtual environments",
  "security": "Security tools for vulnerability scanning, secret detection, and dependency auditing",
  "testing": "Testing tools for unit tests, integration tests, coverage, and test automation",
  "uncategorized": "General-purpose CLI tools and utilities",
};

/**
 * Get a human-readable description for a domain plugin.
 * Falls back to a generated description from package names.
 */
function domainDescription(domain: string, entries: ManifestEntry[]): string {
  const baseDomain = domain.split("/")[0]!;
  const desc = DOMAIN_DESCRIPTIONS[baseDomain];
  if (desc) return desc;

  const names = entries.slice(0, 5).map(e => e.name).join(", ");
  const more = entries.length > 5 ? ` and ${entries.length - 5} more` : "";
  return `Tools for ${domain} workflows including ${names}${more}`;
}

/**
 * Flatten a domain identifier to a valid kebab-case plugin name.
 * "ai-ml/llm-inference" → "ai-ml-llm-inference"
 */
function flattenDomain(domain: string): string {
  return domain.replace(/\//g, "-");
}

/**
 * Collect the most common license from skill frontmatters, defaulting to "MIT".
 */
function inferLicense(entries: ManifestEntry[], skillsSourceDir?: string): string {
  if (!skillsSourceDir) return "MIT";

  const licenses = new Map<string, number>();
  for (const entry of entries) {
    const skillPath = path.join(skillsSourceDir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    try {
      const content = fs.readFileSync(skillPath, "utf-8");
      const match = content.match(/^license:\s*["']?(.+?)["']?\s*$/m);
      if (match) {
        const lic = match[1]!.trim();
        if (lic && lic !== "NOASSERTION") {
          licenses.set(lic, (licenses.get(lic) ?? 0) + 1);
        }
      }
    } catch { /* skip unreadable files */ }
  }

  if (licenses.size === 0) return "MIT";

  // Return most common
  let best = "MIT";
  let bestCount = 0;
  for (const [lic, count] of licenses) {
    if (count > bestCount) { best = lic; bestCount = count; }
  }
  return best;
}

/**
 * Copy a skill directory into the plugin's skills/ folder.
 * Copies SKILL.md and any references/ or scripts/ subdirectories.
 * Validates all paths stay within the target directory.
 */
function copySkillIntoPlugin(
  skillName: string,
  sourceDir: string,
  targetSkillsDir: string,
): boolean {
  // P0: Validate skill name to prevent path traversal
  validatePluginName(skillName, "skill name");

  const srcSkillDir = path.join(sourceDir, skillName);
  const srcSkillMd = path.join(srcSkillDir, "SKILL.md");

  if (!fs.existsSync(srcSkillMd)) return false;

  const destDir = path.join(targetSkillsDir, skillName);

  // P0: Verify destination stays within target
  assertWithinDir(destDir, targetSkillsDir, "skill copy dest");

  fs.mkdirSync(destDir, { recursive: true });

  // Copy SKILL.md
  fs.copyFileSync(srcSkillMd, path.join(destDir, "SKILL.md"));

  // Copy references/ if present (only regular files, one level deep)
  const refsDir = path.join(srcSkillDir, "references");
  if (fs.existsSync(refsDir) && fs.statSync(refsDir).isDirectory()) {
    const destRefs = path.join(destDir, "references");
    assertWithinDir(destRefs, targetSkillsDir, "skill references dest");
    fs.mkdirSync(destRefs, { recursive: true });
    for (const f of fs.readdirSync(refsDir)) {
      validatePluginName(f, "reference file");
      const src = path.join(refsDir, f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(destRefs, f));
      }
    }
  }

  // Copy scripts/ if present (only regular files, one level deep)
  const scriptsDir = path.join(srcSkillDir, "scripts");
  if (fs.existsSync(scriptsDir) && fs.statSync(scriptsDir).isDirectory()) {
    const destScripts = path.join(destDir, "scripts");
    assertWithinDir(destScripts, targetSkillsDir, "skill scripts dest");
    fs.mkdirSync(destScripts, { recursive: true });
    for (const f of fs.readdirSync(scriptsDir)) {
      validatePluginName(f, "script file");
      const src = path.join(scriptsDir, f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(destScripts, f));
      }
    }
  }

  return true;
}

/**
 * Generate a user-invokable search command for a domain plugin.
 * Uses $ARGUMENTS — the standard Claude Code skill argument placeholder.
 */
function generateSearchCommand(domain: string, entries: ManifestEntry[]): string {
  const toolNames = entries.map(e => e.name).join(", ");
  return [
    "---",
    `description: Search ${domain} tools and documentation. Use when looking for ${domain} commands, flags, or usage patterns.`,
    "---",
    "",
    `Search across ${domain} domain tools for the query "$ARGUMENTS".`,
    "",
    `Available tools in this domain: ${toolNames}`,
    "",
    "Find relevant commands, flags, examples, and usage patterns. Return concise results.",
    "",
  ].join("\n");
}

/**
 * Generate a list command for a domain plugin.
 */
function generateListCommand(domain: string, entries: ManifestEntry[]): string {
  const lines = entries.map(e => `- **${e.name}**: ${e.description || "CLI tool"}`);
  return [
    "---",
    `description: List all ${domain} tools available in this plugin`,
    "disable-model-invocation: true",
    "---",
    "",
    `# ${domain} tools`,
    "",
    `This plugin provides ${entries.length} tools:`,
    "",
    ...lines,
    "",
  ].join("\n");
}

/**
 * Build domain plugins from a skills manifest.
 * Produces self-contained plugin directories conforming to Claude Code spec.
 *
 * Supports dry-run mode: when opts.dryRun is true, returns what would be
 * built without writing any files.
 */
export async function buildPlugins(opts?: BuildPluginsOptions): Promise<BuildPluginsResult> {
  const {
    domain: domainFilter,
    aiGenerate = false,
    rootDir,
    manifestPath: manifestPathOpt,
    pluginsDir: pluginsDirOpt,
    skillsSourceDir,
    dryRun = false,
  } = opts ?? {};

  const root = rootDir ?? process.cwd();
  const pluginsDir = pluginsDirOpt ?? path.resolve(root, "plugins");
  const manifestPath =
    manifestPathOpt ?? path.resolve(root, "skills-manifest.json");

  const raw = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as Manifest;

  // Group entries by flattened domain (ai-ml/llm-inference → ai-ml-llm-inference)
  // P3: Track original domains per flat key to detect collisions
  const byDomain = new Map<string, { originals: Set<string>; entries: ManifestEntry[] }>();
  for (const entry of manifest.repos) {
    if (domainFilter && entry.domain !== domainFilter) continue;
    const flat = flattenDomain(entry.domain);
    const existing = byDomain.get(flat);
    if (existing) {
      existing.originals.add(entry.domain);
      existing.entries.push(entry);
    } else {
      byDomain.set(flat, { originals: new Set([entry.domain]), entries: [entry] });
    }
  }

  let totalSkillsCopied = 0;
  const domains: string[] = [];

  if (dryRun) {
    for (const [flatDomain, { entries }] of byDomain) {
      domains.push(flatDomain);
      // Only count skills whose SKILL.md actually exists (match non-dry-run behavior)
      if (skillsSourceDir) {
        for (const entry of entries) {
          if (fs.existsSync(path.join(skillsSourceDir, entry.name, "SKILL.md"))) {
            totalSkillsCopied++;
          }
        }
      } else {
        totalSkillsCopied += entries.length;
      }
    }
    return { pluginCount: byDomain.size, skillsCopied: totalSkillsCopied, domains };
  }

  fs.mkdirSync(pluginsDir, { recursive: true });

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";

  for (const [flatDomain, { originals, entries }] of byDomain) {
    // P3: Validate flattened domain name
    validatePluginName(flatDomain, "plugin domain");
    domains.push(flatDomain);

    const pluginName = flatDomain;
    const pluginDir = path.join(pluginsDir, pluginName);

    // P0: Verify plugin dir stays within pluginsDir
    assertWithinDir(pluginDir, pluginsDir, "plugin dir");

    // Create standard plugin directory structure
    const metaDir = path.join(pluginDir, ".claude-plugin");
    const skillsDir = path.join(pluginDir, "skills");
    const agentsDir = path.join(pluginDir, "agents");
    const commandsDir = path.join(pluginDir, "commands");

    fs.mkdirSync(metaDir, { recursive: true });
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.mkdirSync(commandsDir, { recursive: true });

    // 1. Copy skills into plugin (self-contained)
    if (skillsSourceDir) {
      for (const entry of entries) {
        try {
          if (copySkillIntoPlugin(entry.name, skillsSourceDir, skillsDir)) {
            totalSkillsCopied++;
          }
        } catch {
          // Skip skills with invalid names — don't abort the whole build
        }
      }
    }

    // 2. Generate agent markdown files
    const pkgNames = entries.map(e => e.name);
    // Use first original domain for description context
    const origDomain = [...originals][0]!;

    if (aiGenerate && apiKey) {
      try {
        const agentMds = await generateAgentMarkdown(origDomain, pkgNames, apiKey);
        for (const agent of agentMds) {
          validatePluginName(agent.name, "agent name");
          fs.writeFileSync(
            path.join(agentsDir, `${agent.name}.md`),
            agent.content,
            "utf-8"
          );
        }
      } catch {
        const defaultAgent = defaultAgentMarkdown(origDomain, pkgNames);
        fs.writeFileSync(
          path.join(agentsDir, `${defaultAgent.name}.md`),
          defaultAgent.content,
          "utf-8"
        );
      }
    } else {
      const defaultAgent = defaultAgentMarkdown(origDomain, pkgNames);
      fs.writeFileSync(
        path.join(agentsDir, `${defaultAgent.name}.md`),
        defaultAgent.content,
        "utf-8"
      );
    }

    // 3. Generate user-invokable commands
    fs.writeFileSync(
      path.join(commandsDir, "search.md"),
      generateSearchCommand(origDomain, entries),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(commandsDir, "list.md"),
      generateListCommand(origDomain, entries),
      "utf-8"
    );

    // 4. Write plugin.json manifest (official schema only)
    const description = domainDescription(origDomain, entries);
    const keywords = [
      origDomain,
      ...origDomain.split("/"),
      ...entries.slice(0, 10).map(e => e.name),
      "claude-code",
      "plugin",
    ].filter((v, i, a) => a.indexOf(v) === i);

    // P3: Infer license from skills instead of hardcoding MIT
    const license = inferLicense(entries, skillsSourceDir);

    const pluginManifest: PluginManifest = {
      name: pluginName,
      version: "1.0.0",
      description,
      keywords,
      license,
    };

    fs.writeFileSync(
      path.join(metaDir, "plugin.json"),
      JSON.stringify(pluginManifest, null, 2) + "\n",
      "utf-8"
    );
  }

  return { pluginCount: byDomain.size, skillsCopied: totalSkillsCopied, domains };
}
