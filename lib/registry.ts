import type {
  ToolRegistry,
  RegistryEntry,
  RegistrySearchOptions,
  RegistryLayer,
  ToolStore,
} from "./types.js";
import { fetchJson } from "./resolver.js";

/** Search the local store for matching tools */
async function searchLocal(
  store: ToolStore,
  query: string,
  limit: number,
): Promise<RegistryEntry[]> {
  const result = await store.list({ text: query, limit });
  return result.tools.map((tool) => ({
    id: tool.id,
    meta: tool.meta,
    source: tool.source,
    layer: "local" as RegistryLayer,
    verified: true,
    downloads: 0,
  }));
}

/** Search GitHub for repos with the agents-cli topic */
async function searchGithub(
  query: string,
  limit: number,
): Promise<RegistryEntry[]> {
  try {
    const data = await fetchJson(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+topic:agents-cli&per_page=${limit}`,
    ) as { items?: Array<Record<string, unknown>> };

    if (!data.items) return [];

    return data.items.map((item) => ({
      id: (item.name as string) ?? "",
      meta: {
        name: (item.name as string) ?? "",
        version: "0.0.0",
        description: (item.description as string) ?? "",
        homepage: (item.html_url as string) || undefined,
        license: (item.license as Record<string, unknown>)?.spdx_id as string | undefined,
        tags: Array.isArray(item.topics) ? item.topics as string[] : [],
      },
      source: {
        format: "github" as const,
        uri: (item.full_name as string) ?? "",
        ref: (item.default_branch as string) ?? "main",
      },
      layer: "github" as RegistryLayer,
      verified: false,
      downloads: (item.stargazers_count as number) ?? 0,
    }));
  } catch {
    return [];
  }
}

/** Search npm registry for packages with agents-cli keyword */
async function searchNpm(
  query: string,
  limit: number,
): Promise<RegistryEntry[]> {
  try {
    const data = await fetchJson(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}+keywords:agents-cli-tool&size=${limit}`,
    ) as { objects?: Array<{ package: Record<string, unknown> }> };

    if (!data.objects) return [];

    return data.objects.map((obj) => {
      const pkg = obj.package;
      return {
        id: (pkg.name as string) ?? "",
        meta: {
          name: (pkg.name as string) ?? "",
          version: (pkg.version as string) ?? "0.0.0",
          description: (pkg.description as string) ?? "",
          homepage: (pkg.links as Record<string, string>)?.homepage || undefined,
          tags: Array.isArray(pkg.keywords) ? pkg.keywords as string[] : [],
        },
        source: {
          format: "npm" as const,
          uri: (pkg.name as string) ?? "",
        },
        layer: "npm" as RegistryLayer,
        verified: false,
        downloads: 0,
      };
    });
  } catch {
    return [];
  }
}

/** Create a registry with 4-layer cascade */
export function createRegistry(store?: ToolStore): ToolRegistry {
  return {
    async search(options: RegistrySearchOptions): Promise<readonly RegistryEntry[]> {
      const layers = options.layers ?? ["local", "community", "github", "npm"];
      const limit = options.limit ?? 20;
      const perLayer = Math.ceil(limit / layers.length);
      const results: RegistryEntry[] = [];

      for (const layer of layers) {
        if (results.length >= limit) break;

        switch (layer) {
          case "local":
            if (store) {
              results.push(...await searchLocal(store, options.query, perLayer));
            }
            break;
          case "community":
            // Phase 7: REST API backend
            break;
          case "github":
            results.push(...await searchGithub(options.query, perLayer));
            break;
          case "npm":
            results.push(...await searchNpm(options.query, perLayer));
            break;
        }
      }

      return results.slice(0, limit);
    },

    async lookup(id: string): Promise<RegistryEntry | null> {
      // Check local first
      if (store) {
        const tool = await store.get(id);
        if (tool) {
          return {
            id: tool.id,
            meta: tool.meta,
            source: tool.source,
            layer: "local",
            verified: true,
            downloads: 0,
          };
        }
      }

      // Try GitHub
      const ghResults = await searchGithub(id, 1);
      if (ghResults[0]) return ghResults[0];

      // Try npm
      const npmResults = await searchNpm(id, 1);
      if (npmResults[0]) return npmResults[0];

      return null;
    },

    async publish(_entry: RegistryEntry): Promise<void> {
      // Phase 7: community registry publishing
      throw new Error("Registry publishing not yet implemented");
    },
  };
}
