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
  // Flatten subdomain keys (ai-ml/llm-inference → ai-ml)
  const baseDomain = domain.split("/")[0]!;
  const desc = DOMAIN_DESCRIPTIONS[baseDomain];
  if (desc) return desc;

  // Fallback: list top 5 tool names
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
 * Copy a skill directory into the plugin's skills/ folder.
 * Copies SKILL.md and any references/ or scripts/ subdirectories.
 */
function copySkillIntoPlugin(
  skillName: string,
  sourceDir: string,
  targetSkillsDir: string
): boolean {
  const srcSkillDir = path.join(sourceDir, skillName);
  const srcSkillMd = path.join(srcSkillDir, "SKILL.md");

  if (!fs.existsSync(srcSkillMd)) return false;

  const destDir = path.join(targetSkillsDir, skillName);
  fs.mkdirSync(destDir, { recursive: true });

  // Copy SKILL.md
  fs.copyFileSync(srcSkillMd, path.join(destDir, "SKILL.md"));

  // Copy references/ if present
  const refsDir = path.join(srcSkillDir, "references");
  if (fs.existsSync(refsDir) && fs.statSync(refsDir).isDirectory()) {
    const destRefs = path.join(destDir, "references");
    fs.mkdirSync(destRefs, { recursive: true });
    for (const f of fs.readdirSync(refsDir)) {
      const src = path.join(refsDir, f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(destRefs, f));
      }
    }
  }

  // Copy scripts/ if present
  const scriptsDir = path.join(srcSkillDir, "scripts");
  if (fs.existsSync(scriptsDir) && fs.statSync(scriptsDir).isDirectory()) {
    const destScripts = path.join(destDir, "scripts");
    fs.mkdirSync(destScripts, { recursive: true });
    for (const f of fs.readdirSync(scriptsDir)) {
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
 */
function generateSearchCommand(domain: string, entries: ManifestEntry[]): string {
  const toolNames = entries.map(e => e.name).join(", ");
  return [
    "---",
    `description: Search ${domain} tools and documentation`,
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
 */
export async function buildPlugins(opts?: BuildPluginsOptions): Promise<void> {
  const {
    domain: domainFilter,
    aiGenerate = false,
    rootDir,
    manifestPath: manifestPathOpt,
    pluginsDir: pluginsDirOpt,
    skillsSourceDir,
  } = opts ?? {};

  const root = rootDir ?? process.cwd();
  const pluginsDir = pluginsDirOpt ?? path.resolve(root, "plugins");
  const manifestPath =
    manifestPathOpt ?? path.resolve(root, "skills-manifest.json");

  const raw = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as Manifest;

  // Group entries by flattened domain (ai-ml/llm-inference → ai-ml-llm-inference)
  const byDomain = new Map<string, { original: string; entries: ManifestEntry[] }>();
  for (const entry of manifest.repos) {
    if (domainFilter && entry.domain !== domainFilter) continue;
    const flat = flattenDomain(entry.domain);
    const existing = byDomain.get(flat);
    if (existing) {
      existing.entries.push(entry);
    } else {
      byDomain.set(flat, { original: entry.domain, entries: [entry] });
    }
  }

  fs.mkdirSync(pluginsDir, { recursive: true });

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";

  for (const [flatDomain, { original: origDomain, entries }] of byDomain) {
    const pluginName = flatDomain;
    const pluginDir = path.join(pluginsDir, pluginName);

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
    let copiedCount = 0;
    if (skillsSourceDir) {
      for (const entry of entries) {
        if (copySkillIntoPlugin(entry.name, skillsSourceDir, skillsDir)) {
          copiedCount++;
        }
      }
    }

    // 2. Generate agent markdown files
    const pkgNames = entries.map(e => e.name);
    if (aiGenerate && apiKey) {
      try {
        const agentMds = await generateAgentMarkdown(origDomain, pkgNames, apiKey);
        for (const agent of agentMds) {
          fs.writeFileSync(
            path.join(agentsDir, `${agent.name}.md`),
            agent.content,
            "utf-8"
          );
        }
      } catch {
        // Fallback to default agent
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
    ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

    const pluginManifest: PluginManifest = {
      name: pluginName,
      version: "1.0.0",
      description,
      keywords,
      license: "MIT",
    };

    fs.writeFileSync(
      path.join(metaDir, "plugin.json"),
      JSON.stringify(pluginManifest, null, 2) + "\n",
      "utf-8"
    );
  }
}
