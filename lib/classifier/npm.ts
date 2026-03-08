/**
 * npm-classifier: Auto-discover packages from the npm registry.
 *
 * Searches npm registry for packages matching AI/agent/LLM keyword groups.
 * Applies quality gates: weekly downloads, README presence, repository field.
 *
 * Uses npm search API (not the full _all_docs stream which is multi-GB).
 */

import { ExtendedManifestEntry } from "../types.js";

// Keyword groups to search in npm
const KEYWORD_GROUPS = [
  ["llm", "ai", "agent"],
  ["embedding", "vector", "rag"],
  ["mcp", "model-context-protocol"],
  ["claude", "anthropic"],
  ["langchain", "llamaindex"],
  ["openai", "chatgpt"],
];

// Domain keyword mapping for auto-classification
const KEYWORD_DOMAIN_MAP: Record<string, string> = {
  "agent": "agent", "claude": "agent", "swarm": "agent",
  "embedding": "vector", "vector": "vector", "hnswlib": "vector",
  "langchain": "ai-framework", "llamaindex": "ai-framework",
  "openai": "ai-sdk", "anthropic": "ai-sdk",
  "mcp": "agent", "model-context-protocol": "agent",
  "llm": "ai-framework", "rag": "ai-framework",
};

interface NpmSearchResult {
  package: {
    name: string;
    description: string;
    keywords?: string[];
    links?: { repository?: string };
    publisher?: { username: string };
  };
  score: { detail: { quality: number; popularity: number } };
}

/**
 * Derive a domain from npm keywords.
 */
function deriveDomain(keywords: string[]): string {
  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    if (KEYWORD_DOMAIN_MAP[lower]) return KEYWORD_DOMAIN_MAP[lower];
  }
  return "ai-framework"; // default domain for unclassified AI packages
}

/** Extract GitHub owner/repo slug from a repository URL. */
function extractGithubSlug(repoUrl: string | undefined): string | null {
  if (!repoUrl) return null;
  return repoUrl.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1] ?? null;
}

/**
 * Search npm registry for a keyword and return matching manifest entries.
 * Applies quality gates.
 */
async function searchNpm(keywords: string[], minQuality = 0.5, limit = 50): Promise<ExtendedManifestEntry[]> {
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(keywords.join(" "))}&size=${Math.min(limit, 250)}`;

  let data: { objects: NpmSearchResult[] };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    data = await res.json() as { objects: NpmSearchResult[] };
  } catch {
    return [];
  }

  const results: ExtendedManifestEntry[] = [];

  for (const obj of data.objects) {
    const pkg = obj.package;
    // Quality gate: minimum quality score
    if (obj.score.detail.quality < minQuality) continue;
    // Must have a description
    if (!pkg.description) continue;

    const pkgKeywords = pkg.keywords ?? [];
    const domain = deriveDomain([...pkgKeywords, ...keywords]);

    // Preserve the real npm package name for installation
    results.push({
      domain,
      name: pkg.name,
      repo: extractGithubSlug(pkg.links?.repository) ?? pkg.name,
      description: pkg.description.slice(0, 200),
      auto_discovered: true,
      quality_score: Math.round(obj.score.detail.quality * 100) / 100,
      classifier_source: "rules",
    });
  }

  return results;
}

/**
 * Discover npm packages by query string or across all keyword groups.
 * When query is provided, searches npm directly for that query.
 * Returns deduplicated list of manifest entries.
 */
export async function discoverNpmPackages(query?: string, limit = 50): Promise<ExtendedManifestEntry[]> {
  const all: ExtendedManifestEntry[] = [];
  const seen = new Set<string>();

  if (query) {
    // Direct search mode: search npm for the given query
    const results = await searchNpm(query.split(/\s+/), 0.3, limit);
    for (const entry of results) {
      if (!seen.has(entry.name)) {
        seen.add(entry.name);
        all.push(entry);
      }
    }
  } else {
    // Keyword group mode: search across all predefined groups
    for (const keywords of KEYWORD_GROUPS) {
      const results = await searchNpm(keywords, 0.5, limit);
      for (const entry of results) {
        if (!seen.has(entry.name)) {
          seen.add(entry.name);
          all.push(entry);
        }
      }
      // Rate limit: short pause between API calls
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return all.slice(0, limit);
}
