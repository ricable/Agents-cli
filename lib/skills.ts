import type {
  Skill,
  SkillFrontmatter,
  SkillCompatibility,
  SkillResources,
  Tool,
  ToolCapabilities,
  Lockfile,
  LockEntry,
  ToolStore,
} from "./types.js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createResolver } from "./resolver.js";
import { createInstaller } from "./installer.js";
import { createAnalyzer, findMainBinary } from "./analyzer.js";
import { createStore, getToolInstallDir } from "./store.js";
import { readPkgVersion } from "./pkg-utils.js";

// =============================================================================
// YAML Frontmatter Parsing
// =============================================================================

/** Parse a simple YAML value (scalars, inline arrays) */
function parseYamlValue(raw: string): string | string[] {
  const trimmed = raw.trim();

  // Inline array: [a, b, c]
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === "") return [];
    return inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }

  // Quoted string
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/** Parse SKILL.md frontmatter from raw markdown content */
export function parseFrontmatter(content: string): SkillFrontmatter | null {
  // Match frontmatter between --- delimiters
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match?.[1]) return null;

  const yamlBlock = match[1];
  const lines = yamlBlock.split("\n").map((l) => l.replace(/\r$/, ""));

  const data: Record<string, string | string[]> = {};
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const line of lines) {
    // Blank or comment line
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }

    // List item under a key (e.g. "  - value")
    const listMatch = /^\s+-\s+(.+)/.exec(line);
    if (listMatch?.[1] && currentKey && currentArray) {
      currentArray.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    // Key: value pair
    const kvMatch = /^(\w[\w-]*)\s*:\s*(.*)$/.exec(line);
    if (kvMatch?.[1]) {
      // Save previous array key if pending
      if (currentKey && currentArray) {
        data[currentKey] = currentArray;
      }

      const key = kvMatch[1];
      const rawValue = kvMatch[2] ?? "";

      if (rawValue.trim() === "" || rawValue.trim() === "[]") {
        // Start of a block array or empty array
        currentKey = key;
        currentArray = rawValue.trim() === "[]" ? [] : [];
        if (rawValue.trim() === "[]") {
          data[key] = [];
          currentKey = null;
          currentArray = null;
        }
      } else {
        // Flush any pending array
        currentKey = null;
        currentArray = null;

        const parsed = parseYamlValue(rawValue);
        data[key] = parsed;
      }
      continue;
    }
  }

  // Flush final array
  if (currentKey && currentArray) {
    data[currentKey] = currentArray;
  }

  // Validate required fields (version is optional, defaults to "0.0.0")
  const name = typeof data.name === "string" ? data.name : null;
  const version = typeof data.version === "string" ? data.version : "0.0.0";
  const description = typeof data.description === "string" ? data.description : null;

  if (!name || !description) return null;

  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  // Parse compatibility (optional)
  let compatibility: SkillCompatibility | undefined;
  const nodeReq = typeof data.node === "string" ? data.node : undefined;
  const pythonReq = typeof data.python === "string" ? data.python : undefined;
  const toolsReq = Array.isArray(data.requires) ? data.requires : undefined;
  if (nodeReq || pythonReq || toolsReq) {
    compatibility = { node: nodeReq, python: pythonReq, tools: toolsReq };
  }

  return { name, version, description, ingredients, tags, compatibility };
}

// =============================================================================
// Bundled Resources
// =============================================================================

const RESOURCE_DIRS = ["scripts", "references", "assets"] as const;

/** Discover bundled resource files in a skill directory */
export function discoverResources(skillDir: string): SkillResources {
  const result: Record<string, string[]> = { scripts: [], references: [], assets: [] };

  for (const dir of RESOURCE_DIRS) {
    const full = join(skillDir, dir);
    if (!existsSync(full)) continue;
    try {
      const entries = readdirSync(full, { recursive: true }) as string[];
      for (const entry of entries) {
        const entryPath = join(full, entry);
        // Only include files, not directories
        try {
          if (!readdirSync(entryPath).length) continue;
        } catch {
          // Not a directory — it's a file
          result[dir]!.push(entryPath);
        }
      }
    } catch { /* skip unreadable */ }
  }

  return {
    scripts: result.scripts!,
    references: result.references!,
    assets: result.assets!,
  };
}

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
  let capabilities: ToolCapabilities = { commands: [], globalFlags: [], analysisMethod: "help-probe" };
  const mainBin = findMainBinary(installDir);
  if (mainBin) {
    try {
      capabilities = await analyzer.analyze(mainBin, { recursive: options.recursive });
    } catch {
      // analysis failed, use defaults
    }
  }

  // Determine version
  const version = readPkgVersion(installDir, resolved.meta.version ?? "0.0.0");

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
// Lockfile
// =============================================================================

/** Compute integrity hash for a lock entry */
function computeIntegrity(sourceUri: string, version: string): string {
  return createHash("sha256")
    .update(`${sourceUri}@${version}`)
    .digest("hex");
}

/** Parse an agentcli.lock JSON string into a Lockfile object */
export function parseLockfile(content: string): Lockfile | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.version !== 1) return null;
    if (!Array.isArray(data.entries)) return null;
    if (typeof data.generatedAt !== "string") return null;

    const entries: LockEntry[] = [];
    for (const entry of data.entries as Record<string, unknown>[]) {
      if (
        typeof entry.id !== "string" ||
        typeof entry.version !== "string" ||
        typeof entry.integrity !== "string" ||
        !entry.source ||
        typeof entry.source !== "object"
      ) {
        return null;
      }
      const source = entry.source as Record<string, unknown>;
      if (typeof source.format !== "string" || typeof source.uri !== "string") {
        return null;
      }
      entries.push({
        id: entry.id,
        version: entry.version,
        source: {
          format: source.format as Tool["source"]["format"],
          uri: source.uri,
          ref: typeof source.ref === "string" ? source.ref : undefined,
          subpath: typeof source.subpath === "string" ? source.subpath : undefined,
        },
        integrity: entry.integrity,
      });
    }

    return {
      version: 1,
      entries,
      generatedAt: data.generatedAt as string,
    };
  } catch {
    return null;
  }
}

/** Generate a lockfile object from an array of installed tools */
export function generateLockfile(tools: Tool[]): Lockfile {
  const entries: LockEntry[] = tools.map((tool) => ({
    id: tool.id,
    version: tool.meta.version,
    source: tool.source,
    integrity: computeIntegrity(tool.source.uri, tool.meta.version),
  }));

  return {
    version: 1,
    entries,
    generatedAt: new Date().toISOString(),
  };
}

/** Write a lockfile to disk */
export function writeLockfile(lockPath: string, tools: Tool[]): void {
  const lockfile = generateLockfile(tools);
  writeFileSync(lockPath, JSON.stringify(lockfile, null, 2), "utf-8");
}

/** Read a lockfile from disk */
export function readLockfile(lockPath: string): Lockfile | null {
  if (!existsSync(lockPath)) return null;
  const content = readFileSync(lockPath, "utf-8");
  return parseLockfile(content);
}

// =============================================================================
// Context Building
// =============================================================================

/** Build context with progressive disclosure — metadata summary first, details on demand */
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

  // Bundled resources summary if any
  const resources = skill.resources ?? { scripts: [], references: [], assets: [] };
  if (resources.scripts.length > 0 || resources.references.length > 0) {
    sections.push("## Bundled Resources");
    sections.push("");
    if (resources.scripts.length > 0) {
      sections.push("**Scripts** (run directly, no need to load into context):");
      for (const s of resources.scripts) {
        sections.push(`- \`${s}\``);
      }
      sections.push("");
    }
    if (resources.references.length > 0) {
      sections.push("**References** (read when needed for domain-specific guidance):");
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

  // Level 3: Tool details — command/flag summary, not full raw help
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

      // Compact command summary instead of full CONTEXT.md dump
      if (tool.capabilities.commands.length > 0) {
        sections.push("**Commands**: " + tool.capabilities.commands.map((c) => `\`${c.name}\``).join(", "));
        sections.push("");
      }
      if (tool.capabilities.globalFlags.length > 0) {
        sections.push("**Flags**: " + tool.capabilities.globalFlags.map((f) => `\`${f.name}\``).join(", "));
        sections.push("");
      }

      // Point to full help instead of inlining it
      if (tool.capabilities.rawHelp) {
        sections.push(`_Run \`agents-cli describe ${tool.id}\` for full help output._`);
        sections.push("");
      }
    }
  }

  return sections.join("\n");
}

// =============================================================================
// Skill Scaffolding
// =============================================================================

/**
 * Generate a rich SKILL.md from an installed tool's discovered capabilities.
 *
 * This is the gws-style approach: every installed tool gets a real skill file
 * with command reference, flags, examples, and workflow guidance — not a stub.
 * The quality depends on what --help reveals. Compiled tools with no binary
 * will produce a thinner skill, but it's still better than nothing.
 */
export function generateRichSkillMd(tool: Tool): string {
  const commands = tool.capabilities.commands;
  const flags = tool.capabilities.globalFlags;
  const desc = tool.meta.description || `CLI tool: ${tool.meta.name}`;

  // Build trigger-aware description
  const cmdNames = commands.slice(0, 5).map(c => c.name).join(", ");
  const triggerHint = commands.length > 0
    ? `Use this skill when the user needs ${tool.meta.name} (commands: ${cmdNames}), even if they don't mention "${tool.meta.name}" explicitly.`
    : `Use this skill when working with ${tool.meta.name}-related tasks.`;

  const s: string[] = [];

  // ── Frontmatter ──
  s.push("---");
  s.push(`name: ${tool.meta.name}`);
  s.push(`version: ${tool.meta.version}`);
  s.push(`description: "${esc(desc)}. ${triggerHint}"`);
  s.push(`ingredients:`);
  s.push(`  - ${tool.source.uri}`);
  s.push(`tags:`);
  const tags = new Set<string>([...(tool.meta.tags as string[]), "cli"]);
  for (const tag of tags) s.push(`  - ${tag}`);
  if (tool.meta.homepage) s.push(`# homepage: ${tool.meta.homepage}`);
  if (tool.meta.license) s.push(`# license: ${tool.meta.license}`);
  s.push("---");
  s.push("");

  // ── Header ──
  s.push(`# ${tool.meta.name}`);
  s.push("");
  s.push(desc);
  s.push("");
  if (tool.meta.homepage) {
    s.push(`**Source**: ${tool.meta.homepage}`);
    s.push("");
  }

  // ── Commands ──
  if (commands.length > 0) {
    s.push("## Commands");
    s.push("");
    for (const cmd of commands) {
      s.push(`### \`${tool.meta.name} ${cmd.name}\``);
      s.push("");
      if (cmd.description) s.push(cmd.description);
      s.push("");
      if (cmd.flags.length > 0) {
        s.push("**Flags:**");
        for (const f of cmd.flags) {
          const alias = f.alias ? ` (${f.alias})` : "";
          s.push(`- \`${f.name}\`${alias} — ${f.description}`);
        }
        s.push("");
      }
    }
  }

  // ── Global flags ──
  if (flags.length > 0) {
    s.push("## Global Options");
    s.push("");
    s.push("| Flag | Alias | Description |");
    s.push("|------|-------|-------------|");
    for (const f of flags) {
      s.push(`| \`${f.name}\` | ${f.alias ? `\`${f.alias}\`` : "—"} | ${f.description} |`);
    }
    s.push("");
  }

  // ── Usage ──
  s.push("## Usage");
  s.push("");
  s.push("```bash");
  s.push(`# Show help`);
  s.push(`${tool.meta.name} --help`);
  if (commands.length > 0) {
    s.push("");
    for (const cmd of commands.slice(0, 5)) {
      s.push(`# ${cmd.description || cmd.name}`);
      s.push(`${tool.meta.name} ${cmd.name}`);
      s.push("");
    }
  }
  s.push("```");
  s.push("");

  // ── Agent notes ──
  s.push("## Agent Integration");
  s.push("");
  s.push("```bash");
  s.push(`# Run via agents-cli (structured JSON output)`);
  s.push(`agents-cli run ${tool.meta.name} -- --help --json`);
  s.push("");
  s.push(`# Introspect command schema`);
  s.push(`agents-cli schema ${tool.meta.name} --json`);
  s.push("");
  s.push(`# Dry-run before executing`);
  s.push(`agents-cli run ${tool.meta.name} -- <args> --dry-run`);
  s.push("```");
  s.push("");

  return s.join("\n");
}

function esc(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ");
}

/** Generate a new SKILL.md scaffold with trigger-aware description */
export function generateSkillMd(name: string, description: string): string {
  // Build a trigger-aware description: what it does + when to use it
  const triggerDesc = `${description}. Use this skill whenever the user works with ${name}-related tasks, even if they don't mention "${name}" explicitly.`;

  return [
    "---",
    `name: ${name}`,
    "version: 0.1.0",
    `description: ${triggerDesc}`,
    "ingredients: []",
    "tags:",
    `  - ${name}`,
    "# node: \">=18\"",
    "# python: \">=3.10\"",
    "---",
    "",
    `# ${name}`,
    "",
    description,
    "",
    "## Usage",
    "",
    "Describe how to use this skill here.",
    "",
  ].join("\n");
}
