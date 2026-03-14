import type { SkillFrontmatter, SkillResources } from "../types.js";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

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
  let compatibility: import("../types.js").SkillCompatibility | undefined;
  const nodeReq = typeof data.node === "string" ? data.node : undefined;
  const pythonReq = typeof data.python === "string" ? data.python : undefined;
  const toolsReq = Array.isArray(data.requires) ? data.requires : undefined;
  if (nodeReq || pythonReq || toolsReq) {
    compatibility = { node: nodeReq, python: pythonReq, tools: toolsReq };
  }

  const domain = typeof data.domain === "string" ? data.domain : undefined;

  return { name, version, description, ingredients, tags, compatibility, domain };
}

/**
 * Extract the body content from a SKILL.md (everything after the closing ---).
 * Returns the full content if no frontmatter is found.
 */
export function extractBody(content: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---/.exec(content);
  if (!match) return content;
  return content.slice(match[0].length).trim();
}

// =============================================================================
// Bundled Resources
// =============================================================================

export const RESOURCE_DIRS = ["scripts", "references", "assets"] as const;

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
