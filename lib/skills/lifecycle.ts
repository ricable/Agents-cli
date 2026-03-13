import type { Skill, Tool, ToolStore, SkillCompatibility } from "../types.js";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createResolver } from "../resolver.js";
import { createInstaller } from "../installer.js";
import { createAnalyzer, findMainBinary } from "../analyzer.js";
import { createStore, getToolInstallDir } from "../store.js";
import { readPkgVersion } from "../pkg-utils.js";
import { readSourceVersion } from "../extractor.js";
import { parseFrontmatter, discoverResources } from "./frontmatter.js";

// =============================================================================
// Shared Tool Installation
// =============================================================================

/** Install a single tool from a source identifier. Shared by `add` command and `installSkill`. */
export async function installTool(
  source: string,
  dataDir: string,
  options: { store?: ToolStore; verbose?: boolean; recursive?: boolean } = {},
): Promise<Tool> {
  const resolver = createResolver();
  const installer = createInstaller();
  const analyzer = createAnalyzer();
  const store = options.store ?? createStore(dataDir);

  if (!resolver.supports(source)) {
    throw new Error(`Unknown source format: ${source}`);
  }

  const resolved = await resolver.resolve(source);
  const toolId = resolved.meta.name ?? source.replace(/[/@]/g, "-").replace(/^-/, "");
  const installDir = getToolInstallDir(dataDir, toolId);

  if (!installer.supports(resolved.source.format)) {
    throw new Error(`Installer does not support format: ${resolved.source.format}`);
  }

  const installResult = await installer.install(resolved.source, installDir);
  if (options.verbose) {
    console.log(`  Installed in ${installResult.duration}ms (${installResult.binaries.length} binaries found)`);
  }

  // Analyze — deep probe if requested, otherwise shallow
  let capabilities: import("../types.js").ToolCapabilities = { commands: [], globalFlags: [], analysisMethod: "help-probe" };
  const mainBin = findMainBinary(installDir, resolved.meta.name);
  if (mainBin) {
    try {
      capabilities = await analyzer.analyze(mainBin, { recursive: options.recursive });
    } catch {
      // analysis failed, use defaults
    }
  }

  // Determine version: package.json → resolved meta → source files (Cargo.toml, etc.)
  const apiVersion = resolved.meta.version;
  const sourceVersion = readSourceVersion(installDir);
  const version = readPkgVersion(installDir, apiVersion ?? sourceVersion ?? "0.0.0");

  const now = new Date().toISOString();
  const tool: Tool = {
    id: toolId,
    meta: {
      name: resolved.meta.name ?? toolId,
      version,
      description: resolved.meta.description ?? "",
      homepage: resolved.meta.homepage,
      license: resolved.meta.license,
      tags: resolved.meta.tags ? [...resolved.meta.tags] : [],
    },
    source: resolved.source,
    capabilities,
    installPath: installDir,
    status: "installed",
    installedAt: now,
    updatedAt: now,
  };

  await store.save(tool);
  return tool;
}

// =============================================================================
// Skill Installation
// =============================================================================

/** Install a skill from a SKILL.md file path, resolving each ingredient sequentially */
export async function installSkill(skillPath: string, dataDir: string): Promise<Skill> {
  const content = readFileSync(skillPath, "utf-8");
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    throw new Error(`Failed to parse SKILL.md frontmatter from: ${skillPath}`);
  }

  // Extract body (everything after the second ---)
  const bodyMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/.exec(content);
  const body = bodyMatch?.[1]?.trim() ?? "";

  const store = createStore(dataDir);
  const tools: Tool[] = [];

  // Install each ingredient using the shared installTool function
  for (const ingredient of frontmatter.ingredients) {
    const tool = await installTool(ingredient, dataDir, { store });
    tools.push(tool);
  }

  // Discover bundled resources from the skill's directory
  const skillDir = dirname(skillPath);
  const resources = discoverResources(skillDir);

  const skillStoreDir = join(dataDir, "skills", frontmatter.name);
  const contextPath = join(skillStoreDir, "CONTEXT.md");
  mkdirSync(skillStoreDir, { recursive: true });

  const skill: Skill = {
    frontmatter,
    body,
    ingredients: tools,
    contextPath,
    resources,
  };

  // Write assembled context
  const contextContent = buildContext(skill);
  writeFileSync(contextPath, contextContent, "utf-8");

  // Write skill metadata for listing/management
  const metaPath = join(skillStoreDir, "skill.json");
  writeFileSync(metaPath, JSON.stringify({
    name: frontmatter.name,
    version: frontmatter.version,
    description: frontmatter.description,
    tags: [...frontmatter.tags],
    compatibility: frontmatter.compatibility,
    ingredients: [...frontmatter.ingredients],
    toolIds: tools.map((t) => t.id),
    resources: {
      scripts: resources.scripts.length,
      references: resources.references.length,
      assets: resources.assets.length,
    },
    installedAt: new Date().toISOString(),
  }, null, 2), "utf-8");

  return skill;
}

// =============================================================================
// Skill Management
// =============================================================================

/** Metadata stored for an installed skill */
export interface InstalledSkillMeta {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly compatibility?: SkillCompatibility;
  readonly ingredients: readonly string[];
  readonly toolIds: readonly string[];
  readonly resources: { scripts: number; references: number; assets: number };
  readonly installedAt: string;
}

/** List all installed skills */
export function listSkills(dataDir: string): InstalledSkillMeta[] {
  const skillsDir = join(dataDir, "skills");
  if (!existsSync(skillsDir)) return [];

  const results: InstalledSkillMeta[] = [];
  try {
    for (const entry of readdirSync(skillsDir)) {
      const metaPath = join(skillsDir, entry, "skill.json");
      if (!existsSync(metaPath)) continue;
      try {
        const meta = JSON.parse(readFileSync(metaPath, "utf-8")) as InstalledSkillMeta;
        results.push(meta);
      } catch { /* skip corrupted */ }
    }
  } catch { /* skip unreadable */ }

  return results;
}

/** Remove an installed skill (and optionally its tools) */
export async function removeSkill(
  name: string,
  dataDir: string,
  options: { removeTools?: boolean } = {},
): Promise<boolean> {
  const skillDir = join(dataDir, "skills", name);
  const metaPath = join(skillDir, "skill.json");

  if (!existsSync(metaPath)) return false;

  // Optionally remove the skill's tools
  if (options.removeTools) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, "utf-8")) as InstalledSkillMeta;
      const store = createStore(dataDir);
      for (const toolId of meta.toolIds) {
        await store.remove(toolId);
      }
    } catch { /* best effort */ }
  }

  // Remove the skill directory
  const { rmSync } = await import("node:fs");
  rmSync(skillDir, { recursive: true, force: true });
  return true;
}

// =============================================================================
// Context Building
// =============================================================================

/** Build context with progressive disclosure — metadata summary first, references on demand */
export function buildContext(skill: Skill): string {
  const sections: string[] = [];

  // Level 1: Skill metadata summary (always loaded)
  sections.push(`# ${skill.frontmatter.name}`);
  sections.push("");
  if (skill.frontmatter.description) {
    sections.push(skill.frontmatter.description);
    sections.push("");
  }

  // Compatibility note if present
  if (skill.frontmatter.compatibility) {
    const compat = skill.frontmatter.compatibility;
    const reqs: string[] = [];
    if (compat.node) reqs.push(`Node.js ${compat.node}`);
    if (compat.python) reqs.push(`Python ${compat.python}`);
    if (compat.tools?.length) reqs.push(`Tools: ${compat.tools.join(", ")}`);
    if (reqs.length > 0) {
      sections.push(`**Requires**: ${reqs.join(" | ")}`);
      sections.push("");
    }
  }

  // Bundled resources — progressive disclosure guidance
  const resources = skill.resources ?? { scripts: [], references: [], assets: [] };
  if (resources.scripts.length > 0 || resources.references.length > 0) {
    sections.push("## Bundled Resources");
    sections.push("");
    if (resources.scripts.length > 0) {
      sections.push("**Scripts** (run directly):");
      for (const sc of resources.scripts) {
        sections.push(`- \`${sc}\``);
      }
      sections.push("");
    }
    if (resources.references.length > 0) {
      sections.push("**References** (read only when you need detailed info on a specific topic):");
      for (const r of resources.references) {
        sections.push(`- \`${r}\``);
      }
      sections.push("");
    }
  }

  // Level 2: Skill body instructions
  if (skill.body) {
    sections.push(skill.body);
    sections.push("");
  }

  // Level 3: Tool details — compact command/flag summary
  if (skill.ingredients.length > 0) {
    sections.push("## Installed Tools");
    sections.push("");

    for (const tool of skill.ingredients) {
      sections.push(`### ${tool.meta.name}@${tool.meta.version}`);
      sections.push("");
      if (tool.meta.description) {
        sections.push(tool.meta.description);
        sections.push("");
      }

      // Compact command summary
      if (tool.capabilities.commands.length > 0) {
        sections.push("**Commands**: " + tool.capabilities.commands.map((c) => `\`${c.name}\``).join(", "));
        sections.push("");
      }
      if (tool.capabilities.globalFlags.length > 0) {
        sections.push("**Flags**: " + tool.capabilities.globalFlags.map((f) => `\`${f.name}\``).join(", "));
        sections.push("");
      }

      // Point to references instead of inlining
      if (tool.capabilities.rawHelp) {
        sections.push(`_Full help: run \`${tool.meta.name} --help\` or see references/help-output.md if bundled._`);
        sections.push("");
      }
    }
  }

  return sections.join("\n");
}

