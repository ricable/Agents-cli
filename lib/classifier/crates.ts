/**
 * crates-classifier: Auto-discover crates from crates.io.
 *
 * Searches crates.io API for crates matching AI/agent/LLM keyword groups.
 * Applies quality gates: downloads count, has repository.
 */

import { ExtendedManifestEntry } from "../types.js";

// Keyword groups to search in crates.io
const KEYWORD_GROUPS = [
  ["ai", "llm", "gpt"],
  ["agent", "autonomous"],
  ["embedding", "vector"],
  ["mcp"],
  ["rag", "retrieval"],
];

// Keyword -> domain mapping
const KEYWORD_DOMAIN_MAP: Record<string, string> = {
  "ai": "ai-framework", "llm": "ai-framework", "gpt": "ai-sdk",
  "agent": "agent", "autonomous": "agent",
  "embedding": "vector", "vector": "vector",
  "mcp": "agent",
  "rag": "ai-framework", "retrieval": "ai-framework",
};

interface CrateSearchResult {
  crates: Array<{
    name: string;
    description: string | null;
    downloads: number;
    repository?: string;
    keywords?: string[];
  }>;
  meta: {
    next_page?: string;
  };
}

/**
 * Derive a domain from crate keywords.
 */
function deriveDomain(keywords: string[]): string {
  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    if (KEYWORD_DOMAIN_MAP[lower]) return KEYWORD_DOMAIN_MAP[lower];
  }
  return "ai-framework";
}

/** Extract GitHub owner/repo slug from a repository URL. */
function extractGithubSlug(repoUrl: string | undefined): string | null {
  if (!repoUrl) return null;
  return repoUrl.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1] ?? null;
}

/**
 * Search crates.io for packages matching keywords.
 */
async function searchCrates(
  keywords: string[],
  minDownloads = 1000,
): Promise<ExtendedManifestEntry[]> {
  const url = `https://crates.io/api/v1/crates?search=${encodeURIComponent(keywords.join(" "))}&per_page=30`;

  let data: CrateSearchResult;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    data = await res.json() as CrateSearchResult;
  } catch {
    return [];
  }

  const results: ExtendedManifestEntry[] = [];

  for (const crate of data.crates) {
    // Quality gate: minimum downloads
    if (crate.downloads < minDownloads) continue;
    // Must have a description
    if (!crate.description) continue;
    // Must have a repository
    const slug = extractGithubSlug(crate.repository);
    if (!slug) continue;

    const crateKeywords = crate.keywords ?? [];
    const domain = deriveDomain([...crateKeywords, ...keywords]);

    results.push({
      domain,
      name: crate.name,
      repo: slug,
      description: crate.description.slice(0, 200),
      auto_discovered: true,
      quality_score: Math.min(1.0, crate.downloads / 100000),
      classifier_source: "rules",
    });
  }

  return results;
}

/**
 * Discover crates.io packages by query string or across all keyword groups.
 * When query is provided, searches crates.io directly for that query.
 */
export async function discoverCratesPackages(query?: string, limit = 50): Promise<ExtendedManifestEntry[]> {
  const all: ExtendedManifestEntry[] = [];
  const seen = new Set<string>();

  if (query) {
    // Direct search mode
    const results = await searchCrates(query.split(/\s+/), 100);
    for (const entry of results) {
      if (!seen.has(entry.name)) {
        seen.add(entry.name);
        all.push(entry);
      }
    }
  } else {
    // Keyword group mode
    for (const keywords of KEYWORD_GROUPS) {
      const results = await searchCrates(keywords, 1000);
      for (const entry of results) {
        if (!seen.has(entry.name)) {
          seen.add(entry.name);
          all.push(entry);
        }
      }
      // Rate limit: short pause between API calls
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return all.slice(0, limit);
}
