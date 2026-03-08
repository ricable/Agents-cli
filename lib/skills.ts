import type { Skill, SkillFrontmatter, Tool, ToolCapabilities, Lockfile, LockEntry } from "./types.js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createResolver } from "./resolver.js";
import { createInstaller } from "./installer.js";
import { createAnalyzer, findMainBinary } from "./analyzer.js";
import { createStore, getToolInstallDir, generateContextMd } from "./store.js";

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

  // Validate required fields
  const name = typeof data.name === "string" ? data.name : null;
  const version = typeof data.version === "string" ? data.version : null;
  const description = typeof data.description === "string" ? data.description : null;

  if (!name || !version || !description) return null;

  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  return { name, version, description, ingredients, tags };
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

  const resolver = createResolver();
  const installer = createInstaller();
  const analyzer = createAnalyzer();
  const store = createStore(dataDir);

  const tools: Tool[] = [];

  // Install each ingredient sequentially
  for (const ingredient of frontmatter.ingredients) {
    if (!resolver.supports(ingredient)) {
      throw new Error(`Unsupported ingredient source: ${ingredient}`);
    }

    const resolved = await resolver.resolve(ingredient);
    const toolId = resolved.meta.name ?? ingredient.replace(/[/@]/g, "-").replace(/^-/, "");
    const installDir = getToolInstallDir(dataDir, toolId);

    // Install
    if (!installer.supports(resolved.source.format)) {
      throw new Error(`Installer does not support format: ${resolved.source.format}`);
    }

    await installer.install(resolved.source, installDir);

    // Analyze
    let capabilities: ToolCapabilities = { commands: [], globalFlags: [], analysisMethod: "help-probe" };
    const mainBin = findMainBinary(installDir);
    if (mainBin) {
      try {
        capabilities = await analyzer.analyze(mainBin);
      } catch {
        // analysis failed, use defaults
      }
    }

    // Determine version
    let version = resolved.meta.version ?? "0.0.0";
    const pkgJsonPath = join(installDir, "package.json");
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as Record<string, unknown>;
        if (typeof pkg.version === "string") version = pkg.version;
      } catch { /* ignore */ }
    }

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
    tools.push(tool);
  }

  const contextPath = join(dataDir, "skills", frontmatter.name, "CONTEXT.md");
  mkdirSync(join(dataDir, "skills", frontmatter.name), { recursive: true });

  const skill: Skill = {
    frontmatter,
    body,
    ingredients: tools,
    contextPath,
  };

  // Write assembled context
  const contextContent = buildContext(skill);
  writeFileSync(contextPath, contextContent, "utf-8");

  return skill;
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

/** Build context by assembling SKILL.md body + tool CONTEXT.md files */
export function buildContext(skill: Skill): string {
  const sections: string[] = [];

  // Skill description first
  sections.push(`# ${skill.frontmatter.name}`);
  sections.push("");
  if (skill.frontmatter.description) {
    sections.push(skill.frontmatter.description);
    sections.push("");
  }
  if (skill.body) {
    sections.push(skill.body);
    sections.push("");
  }

  // Each tool's CONTEXT.md
  for (const tool of skill.ingredients) {
    sections.push("---");
    sections.push("");
    sections.push(generateContextMd(tool));
  }

  return sections.join("\n");
}

// =============================================================================
// Skill Scaffolding
// =============================================================================

/** Generate a new SKILL.md scaffold */
export function generateSkillMd(name: string, description: string): string {
  return [
    "---",
    `name: ${name}`,
    "version: 0.1.0",
    `description: ${description}`,
    "ingredients:",
    "  - ruvnet/example-tool",
    "  - @scope/another-tool",
    "tags:",
    "  - example",
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
