/**
 * Registry seeders: populate the crawl queue from various package registries.
 *
 * Each seeder queries a registry API and inserts discovered packages
 * into the crawl_queue table for batch processing.
 */

import type { UnifiedStore } from "../db/unified-store.js";
import {
  searchLibrariesIo,
  toCrawlItems,
} from "../classifier/libraries-io.js";
import {
  discoverByTopics,
  reposToCrawlItems,
} from "../classifier/github-graphql.js";
import { toErrorMessage } from "../output.js";

/** Check if Libraries.io API key is configured */
function hasLibrariesIoKey(): boolean {
  return !!process.env.LIBRARIES_IO_API_KEY;
}

/** Check if GitHub token is configured (for GraphQL API) */
function hasGitHubToken(): boolean {
  return !!(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
}

// ── Types ──────────────────────────────────────────────────────────────

export interface SeederOptions {
  /** Maximum items to seed (default: 1000) */
  limit?: number;
  /** Category/keyword filter */
  categories?: string[];
  /** Minimum stars/rank threshold */
  minQuality?: number;
}

export interface SeederResult {
  registry: string;
  seeded: number;
  skipped: number;
  errors: string[];
}

// ── Generic Libraries.io Seeder ────────────────────────────────────────

async function seedFromLibrariesIo(
  store: UnifiedStore,
  registry: "pypi" | "npm" | "cargo",
  registryName: string,
  defaultCategories: string[],
  opts?: SeederOptions,
): Promise<SeederResult> {
  const limit = opts?.limit ?? 1000;
  const categories = opts?.categories ?? defaultCategories;
  const errors: string[] = [];
  let totalSeeded = 0;

  for (const category of categories) {
    if (totalSeeded >= limit) break;
    try {
      const remaining = limit - totalSeeded;
      const packages = await searchLibrariesIo({
        query: category,
        registry,
        sort: "rank",
        limit: Math.min(remaining, 30),
      });
      const items = toCrawlItems(packages);
      totalSeeded += store.bulkEnqueue(items);
    } catch (err) {
      errors.push(`${registryName}/${category}: ${toErrorMessage(err)}`);
    }
  }
  return { registry: registryName, seeded: totalSeeded, skipped: 0, errors };
}

// ── Direct Registry Fallback (no API key needed) ───────────────────────

/**
 * Seed using the existing classifier APIs (PyPI JSON API, npm registry).
 * Used as fallback when Libraries.io API key is not set.
 */
async function seedFromDirectRegistry(
  store: UnifiedStore,
  registry: "pypi" | "npm" | "crates",
  categories: string[],
  opts?: SeederOptions,
): Promise<SeederResult> {
  const limit = opts?.limit ?? 1000;
  const errors: string[] = [];
  let totalSeeded = 0;

  const discoverer = registry === "pypi"
    ? (await import("../classifier/pypi.js")).discoverPyPIPackages
    : registry === "npm"
      ? (await import("../classifier/npm.js")).discoverNpmPackages
      : (await import("../classifier/crates.js")).discoverCratesPackages;

  const sourcePrefix = registry === "pypi" ? "pypi:" : registry === "npm" ? "npm:" : "crates:";

  for (const category of categories) {
    if (totalSeeded >= limit) break;
    try {
      const entries = await discoverer(category, Math.min(limit - totalSeeded, 30));
      const items = entries.map((e) => ({
        source: e.name.includes("/") ? e.name : `${sourcePrefix}${e.name}`,
        registry,
        priority: Math.floor((e.quality_score ?? 5) * 10),
        metadata: { domain: e.domain, description: e.description },
      }));
      totalSeeded += store.bulkEnqueue(items);
    } catch (err) {
      errors.push(`${registry}/${category}: ${toErrorMessage(err)}`);
    }
  }
  return { registry, seeded: totalSeeded, skipped: 0, errors };
}

// ── PyPI Seeder ────────────────────────────────────────────────────────

const PYPI_CATEGORIES = [
  "cli", "devops", "testing", "linting", "formatting", "security",
  "machine-learning", "ai", "llm", "agent", "automation", "data",
  "web", "api", "database", "monitoring", "cloud",
];

/** Seed crawl queue with PyPI packages. Uses Libraries.io if API key set, else direct PyPI API. */
export async function seedFromPyPI(store: UnifiedStore, opts?: SeederOptions): Promise<SeederResult> {
  if (hasLibrariesIoKey()) {
    return seedFromLibrariesIo(store, "pypi", "pypi", PYPI_CATEGORIES, opts);
  }
  return seedFromDirectRegistry(store, "pypi", PYPI_CATEGORIES, opts);
}

// ── npm Seeder ─────────────────────────────────────────────────────────

const NPM_CATEGORIES = [
  "cli", "devtools", "testing", "linting", "bundler", "typescript",
  "react", "api", "mcp", "agent", "ai", "database", "security",
  "monitoring", "deployment",
];

/** Seed crawl queue with npm packages. Uses Libraries.io if API key set, else direct npm API. */
export async function seedFromNpm(store: UnifiedStore, opts?: SeederOptions): Promise<SeederResult> {
  if (hasLibrariesIoKey()) {
    return seedFromLibrariesIo(store, "npm", "npm", NPM_CATEGORIES, opts);
  }
  return seedFromDirectRegistry(store, "npm", NPM_CATEGORIES, opts);
}

// ── Crates.io Seeder ───────────────────────────────────────────────────

const CRATES_CATEGORIES = [
  "command-line", "development-tools", "network", "web",
  "database", "cryptography", "filesystem", "parser",
  "testing", "wasm", "embedded", "concurrency",
];

/** Seed crawl queue with crates.io packages. Uses Libraries.io if API key set, else direct crates.io API. */
export async function seedFromCrates(store: UnifiedStore, opts?: SeederOptions): Promise<SeederResult> {
  if (hasLibrariesIoKey()) {
    return seedFromLibrariesIo(store, "cargo", "crates", CRATES_CATEGORIES, opts);
  }
  return seedFromDirectRegistry(store, "crates", CRATES_CATEGORIES, opts);
}

// ── GitHub Seeder ──────────────────────────────────────────────────────

const GITHUB_TOPICS = [
  "cli", "mcp", "mcp-server", "ai-agent", "llm", "devtools",
  "cli-tool", "command-line", "automation", "developer-tools",
  "testing", "linting", "security", "monitoring",
];

/**
 * Seed crawl queue with GitHub repos by topic (uses GraphQL API).
 */
export async function seedFromGitHub(
  store: UnifiedStore,
  opts?: SeederOptions,
): Promise<SeederResult> {
  const limit = opts?.limit ?? 1000;
  const topics = opts?.categories ?? GITHUB_TOPICS;
  const minStars = opts?.minQuality ?? 10;
  const errors: string[] = [];

  if (!hasGitHubToken()) {
    // Fall back to REST API discovery via existing classifier
    try {
      const { discoverGitHubRepos } = await import("../classifier/github.js");
      let totalSeeded = 0;
      for (const topic of topics) {
        if (totalSeeded >= limit) break;
        const entries = await discoverGitHubRepos(topic, Math.min(limit - totalSeeded, 20));
        const items = entries.map((e) => ({
          source: e.name.includes("/") ? e.name : e.repo,
          registry: "github",
          priority: Math.floor((e.quality_score ?? 5) * 10),
          metadata: { domain: e.domain, description: e.description },
        }));
        totalSeeded += store.bulkEnqueue(items);
      }
      return { registry: "github", seeded: totalSeeded, skipped: 0, errors };
    } catch (err) {
      errors.push(`github-rest: ${toErrorMessage(err)}`);
      return { registry: "github", seeded: 0, skipped: 0, errors };
    }
  }

  try {
    const repos = await discoverByTopics(topics, {
      perTopic: Math.ceil(limit / topics.length),
      minStars,
    });

    const items = reposToCrawlItems(repos).slice(0, limit);
    const inserted = store.bulkEnqueue(items);

    return { registry: "github", seeded: inserted, skipped: repos.length - inserted, errors };
  } catch (err) {
    errors.push(`github: ${toErrorMessage(err)}`);
    return { registry: "github", seeded: 0, skipped: 0, errors };
  }
}

// ── MCP Registry Seeder ────────────────────────────────────────────────

/**
 * Seed crawl queue with MCP servers from known sources.
 * Searches GitHub for repos with "mcp-server" topic and npm for "mcp-server-*" packages.
 */
export async function seedFromMCPRegistry(
  store: UnifiedStore,
  opts?: SeederOptions,
): Promise<SeederResult> {
  const limit = opts?.limit ?? 500;
  const errors: string[] = [];
  let totalSeeded = 0;

  // 1. GitHub repos with mcp-server topic
  if (hasGitHubToken()) {
    try {
      const repos = await discoverByTopics(["mcp-server", "model-context-protocol"], {
        perTopic: Math.ceil(limit / 2),
        minStars: 3,
      });
      const items = reposToCrawlItems(repos).map((item) => ({
        ...item,
        registry: "mcp",
      }));
      totalSeeded += store.bulkEnqueue(items);
    } catch (err) {
      errors.push(`mcp-github: ${toErrorMessage(err)}`);
    }
  } else {
    // Fallback to REST API
    try {
      const { discoverGitHubRepos } = await import("../classifier/github.js");
      const entries = await discoverGitHubRepos("mcp-server", Math.ceil(limit / 2));
      const items = entries.map((e) => ({
        source: e.name.includes("/") ? e.name : e.repo,
        registry: "mcp",
        priority: Math.floor((e.quality_score ?? 5) * 10),
        metadata: { domain: e.domain, description: e.description },
      }));
      totalSeeded += store.bulkEnqueue(items);
    } catch (err) {
      errors.push(`mcp-github-rest: ${toErrorMessage(err)}`);
    }
  }

  // 2. npm packages matching mcp-server-*
  if (hasLibrariesIoKey()) {
    try {
      const packages = await searchLibrariesIo({
        query: "mcp-server",
        registry: "npm",
        sort: "rank",
        limit: Math.min(limit - totalSeeded, 30),
      });
      const items = toCrawlItems(packages).map((item) => ({
        ...item,
        registry: "mcp",
      }));
      totalSeeded += store.bulkEnqueue(items);
    } catch (err) {
      errors.push(`mcp-npm: ${toErrorMessage(err)}`);
    }
  } else {
    try {
      const { discoverNpmPackages } = await import("../classifier/npm.js");
      const entries = await discoverNpmPackages("mcp-server", Math.min(limit - totalSeeded, 30));
      const items = entries.map((e) => ({
        source: e.name.startsWith("@") ? e.name : `npm:${e.name}`,
        registry: "mcp",
        priority: Math.floor((e.quality_score ?? 5) * 10),
        metadata: { domain: e.domain, description: e.description },
      }));
      totalSeeded += store.bulkEnqueue(items);
    } catch (err) {
      errors.push(`mcp-npm-direct: ${toErrorMessage(err)}`);
    }
  }

  return { registry: "mcp", seeded: totalSeeded, skipped: 0, errors };
}

// ── Unified seeder ─────────────────────────────────────────────────────

/**
 * Seed from all registries.
 */
export async function seedAll(
  store: UnifiedStore,
  opts?: SeederOptions,
): Promise<SeederResult[]> {
  const perRegistry = Math.ceil((opts?.limit ?? 5000) / 5);
  const registryOpts = { ...opts, limit: perRegistry };

  const results = await Promise.allSettled([
    seedFromPyPI(store, registryOpts),
    seedFromNpm(store, registryOpts),
    seedFromCrates(store, registryOpts),
    seedFromGitHub(store, registryOpts),
    seedFromMCPRegistry(store, registryOpts),
  ]);

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { registry: "unknown", seeded: 0, skipped: 0, errors: [String(r.reason)] },
  );
}
