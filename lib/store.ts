import type { ToolStore, Tool, StoreQuery, StoreQueryResult } from "./types.js";
import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const TOOLS_DIR = "tools";
const STORE_FILE = "tools.json";

/** Generate CONTEXT.md content for a tool */
export function generateContextMd(tool: Tool): string {
  const lines: string[] = [
    `# ${tool.meta.name}`,
    "",
    tool.meta.description,
    "",
    `- **Version**: ${tool.meta.version}`,
    `- **Source**: ${tool.source.format}:${tool.source.uri}`,
    `- **Status**: ${tool.status}`,
    `- **Installed**: ${tool.installedAt}`,
  ];

  if (tool.meta.homepage) {
    lines.push(`- **Homepage**: ${tool.meta.homepage}`);
  }
  if (tool.meta.license) {
    lines.push(`- **License**: ${tool.meta.license}`);
  }
  if (tool.meta.tags.length > 0) {
    lines.push(`- **Tags**: ${tool.meta.tags.join(", ")}`);
  }

  if (tool.capabilities.commands.length > 0) {
    lines.push("", "## Commands", "");
    for (const cmd of tool.capabilities.commands) {
      lines.push(`### \`${cmd.name}\``, "", cmd.description, "");
      if (cmd.flags.length > 0) {
        for (const flag of cmd.flags) {
          const alias = flag.alias ? `, ${flag.alias}` : "";
          lines.push(`- \`${flag.name}${alias}\` — ${flag.description}`);
        }
        lines.push("");
      }
    }
  }

  if (tool.capabilities.globalFlags.length > 0) {
    lines.push("", "## Global Options", "");
    for (const flag of tool.capabilities.globalFlags) {
      const alias = flag.alias ? `, ${flag.alias}` : "";
      lines.push(`- \`${flag.name}${alias}\` — ${flag.description}`);
    }
  }

  if (tool.capabilities.rawHelp) {
    lines.push("", "## Raw Help Output", "", "```", tool.capabilities.rawHelp.trim(), "```");
  }

  lines.push("");
  return lines.join("\n");
}

/** Create a persistent flat-file tool store */
export function createStore(dataDir: string): ToolStore {
  const storeFile = join(dataDir, STORE_FILE);
  const toolsDir = join(dataDir, TOOLS_DIR);

  // Ensure directories exist
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(toolsDir, { recursive: true });

  /** Load all tools from disk */
  function loadTools(): Map<string, Tool> {
    const map = new Map<string, Tool>();
    if (!existsSync(storeFile)) return map;
    try {
      const data = JSON.parse(readFileSync(storeFile, "utf-8")) as Tool[];
      for (const tool of data) {
        map.set(tool.id, tool);
      }
    } catch {
      // corrupted store, start fresh
    }
    return map;
  }

  /** Persist tools to disk */
  function saveTools(tools: Map<string, Tool>): void {
    const data = Array.from(tools.values());
    writeFileSync(storeFile, JSON.stringify(data, null, 2), "utf-8");
  }

  return {
    async get(id: string): Promise<Tool | null> {
      return loadTools().get(id) ?? null;
    },

    async list(query?: StoreQuery): Promise<StoreQueryResult> {
      let results = Array.from(loadTools().values());

      if (query?.status) {
        results = results.filter((t) => t.status === query.status);
      }

      if (query?.tags && query.tags.length > 0) {
        const tagSet = new Set(query.tags);
        results = results.filter((t) =>
          t.meta.tags.some((tag) => tagSet.has(tag)),
        );
      }

      if (query?.text) {
        const lower = query.text.toLowerCase();
        results = results.filter(
          (t) =>
            t.meta.name.toLowerCase().includes(lower) ||
            t.meta.description.toLowerCase().includes(lower),
        );
      }

      const total = results.length;
      const offset = query?.offset ?? 0;
      const limit = query?.limit ?? results.length;
      results = results.slice(offset, offset + limit);

      return { tools: results, total };
    },

    async save(tool: Tool): Promise<void> {
      const tools = loadTools();
      tools.set(tool.id, tool);
      saveTools(tools);

      // Write CONTEXT.md alongside the tool
      const contextDir = join(toolsDir, tool.id);
      mkdirSync(contextDir, { recursive: true });
      writeFileSync(join(contextDir, "CONTEXT.md"), generateContextMd(tool), "utf-8");
    },

    async remove(id: string): Promise<boolean> {
      const tools = loadTools();
      const existed = tools.delete(id);
      if (existed) {
        saveTools(tools);
        // Remove tool directory
        const toolDir = join(toolsDir, id);
        if (existsSync(toolDir)) {
          rmSync(toolDir, { recursive: true, force: true });
        }
      }
      return existed;
    },

    async has(id: string): Promise<boolean> {
      return loadTools().has(id);
    },
  };
}

/** Get the install path for a tool */
export function getToolInstallDir(dataDir: string, toolId: string): string {
  return join(dataDir, TOOLS_DIR, toolId, "package");
}
