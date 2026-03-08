import type { ToolStore, Tool, StoreQuery, StoreQueryResult } from "./types.js";

/** Create a flat-file tool store (Phase 3 upgrades to SQLite FTS5) */
export function createStore(dataDir: string): ToolStore {
  const tools = new Map<string, Tool>();
  void dataDir;

  return {
    async get(id: string): Promise<Tool | null> {
      return tools.get(id) ?? null;
    },

    async list(query?: StoreQuery): Promise<StoreQueryResult> {
      let results = Array.from(tools.values());

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
      tools.set(tool.id, tool);
    },

    async remove(id: string): Promise<boolean> {
      return tools.delete(id);
    },

    async has(id: string): Promise<boolean> {
      return tools.has(id);
    },
  };
}
