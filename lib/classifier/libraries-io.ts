/**
 * Libraries.io unified connector for npm, PyPI, and crates.io discovery.
 *
 * Uses the Libraries.io API (60 req/min free tier) to discover packages
 * across multiple registries through a single interface.
 *
 * Requires LIBRARIES_IO_API_KEY env var for authenticated requests.
 * Falls back to limited unauthenticated access.
 */

import type { ExtendedManifestEntry } from "../types.js";
import { TokenBucketRateLimiter } from "../concurrency.js";

// ── Types ──────────────────────────────────────────────────────────────

export type LibrariesIoRegistry = "pypi" | "npm" | "cargo" | "go";

export interface LibrariesIoSearchOptions {
  query: string;
  registry?: LibrariesIoRegistry;
  sort?: "rank" | "stars" | "dependents_count" | "latest_release_published_at";
  limit?: number;
  page?: number;
}

export interface LibrariesIoPackage {
  name: string;
  platform: string;
  description: string;
  homepage: string;
  repository_url: string;
  normalized_licenses: string[];
  rank: number;
  stars: number;
  forks: number;
  dependents_count: number;
  latest_release_published_at: string;
  latest_release_number: string;
  language: string;
  keywords: string[];
}

// ── Rate limiter (60 req/min) ──────────────────────────────────────────

const rateLimiter = new TokenBucketRateLimiter({
  tokensPerInterval: 55, // Leave some headroom below the 60/min limit
  intervalMs: 60_000,
});

// ── API helpers ────────────────────────────────────────────────────────

const BASE_URL = "https://libraries.io/api";

function getApiKey(): string | undefined {
  return process.env.LIBRARIES_IO_API_KEY;
}

function platformName(registry: LibrariesIoRegistry): string {
  switch (registry) {
    case "pypi": return "Pypi";
    case "npm": return "NPM";
    case "cargo": return "Cargo";
    case "go": return "Go";
  }
}

async function fetchLibrariesIo<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  await rateLimiter.acquire();

  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}${path}`);
  if (apiKey) url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Libraries.io API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// ── Search ─────────────────────────────────────────────────────────────

/**
 * Search Libraries.io for packages matching a query.
 * Supports filtering by registry (pypi, npm, cargo, go).
 */
export async function searchLibrariesIo(opts: LibrariesIoSearchOptions): Promise<LibrariesIoPackage[]> {
  const params: Record<string, string> = {
    q: opts.query,
    per_page: String(opts.limit ?? 30),
    page: String(opts.page ?? 1),
  };

  if (opts.sort) params.sort = opts.sort;
  if (opts.registry) params.platforms = platformName(opts.registry);

  return fetchLibrariesIo<LibrariesIoPackage[]>("/search", params);
}

/**
 * Get package info from Libraries.io.
 */
export async function getPackageInfo(registry: LibrariesIoRegistry, name: string): Promise<LibrariesIoPackage> {
  return fetchLibrariesIo<LibrariesIoPackage>(`/${platformName(registry)}/${encodeURIComponent(name)}`);
}

/**
 * Get packages that depend on a given package (reverse dependencies).
 * Useful for finding related tools in the ecosystem.
 */
export async function getDependents(
  registry: LibrariesIoRegistry,
  name: string,
  limit = 20,
): Promise<LibrariesIoPackage[]> {
  return fetchLibrariesIo<LibrariesIoPackage[]>(
    `/${platformName(registry)}/${encodeURIComponent(name)}/dependents`,
    { per_page: String(limit) },
  );
}

// ── Conversion to ManifestEntry ────────────────────────────────────────

function registryToSourceFormat(platform: string): string {
  switch (platform.toLowerCase()) {
    case "pypi": return "pypi";
    case "npm": return "npm";
    case "cargo": return "crates";
    case "go": return "github"; // Go packages map to GitHub repos
    default: return "github";
  }
}

function toSourcePrefix(platform: string, name: string, repoUrl: string): string {
  switch (platform.toLowerCase()) {
    case "pypi": return `pypi:${name}`;
    case "npm": return name.startsWith("@") ? name : `npm:${name}`;
    case "cargo": return `crates:${name}`;
    default: {
      // Extract owner/repo from repository URL
      const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      return match ? match[1]! : name;
    }
  }
}

/**
 * Convert Libraries.io search results to ExtendedManifestEntry format
 * for insertion into the crawl queue or direct processing.
 */
export function toManifestEntries(packages: LibrariesIoPackage[]): ExtendedManifestEntry[] {
  return packages
    .filter((pkg) => pkg.repository_url || pkg.homepage)
    .map((pkg) => {
      const repoUrl = pkg.repository_url || pkg.homepage;
      const repoMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      const repo = repoMatch ? repoMatch[1]!.replace(/\.git$/, "") : pkg.name;

      return {
        name: pkg.name,
        repo,
        domain: "general", // Will be classified later
        description: pkg.description || "",
        quality_score: normalizeRank(pkg.rank),
        auto_discovered: true,
        classifier_source: "rules" as const,
      };
    });
}

/**
 * Convert Libraries.io results to crawl queue items.
 */
export function toCrawlItems(packages: LibrariesIoPackage[]): Array<{
  source: string;
  registry: string;
  priority: number;
  metadata: Record<string, unknown>;
}> {
  return packages
    .filter((pkg) => pkg.repository_url || pkg.homepage)
    .map((pkg) => ({
      source: toSourcePrefix(pkg.platform, pkg.name, pkg.repository_url || pkg.homepage),
      registry: registryToSourceFormat(pkg.platform),
      priority: Math.min(Math.floor((pkg.rank ?? 0) / 10), 100),
      metadata: {
        stars: pkg.stars,
        dependents: pkg.dependents_count,
        version: pkg.latest_release_number,
        language: pkg.language,
        keywords: pkg.keywords,
      },
    }));
}

function normalizeRank(rank: number): number {
  // Libraries.io rank is 0-100+, normalize to 0-10
  return Math.min(10, Math.max(0, rank / 10));
}
