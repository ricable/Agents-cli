/**
 * github-classifier: Auto-discover repos from GitHub topics.
 *
 * Uses GitHub Search API to find repos tagged with AI/agent topics.
 * Applies quality gates: star count, recent activity, has issues.
 *
 * Requires GITHUB_TOKEN env var for higher rate limits (optional but recommended).
 */

import { execFileSync } from "node:child_process";
import { ExtendedManifestEntry } from "../types.js";

// ── Trending types ───────────────────────────────────────────────────

export type TrendingPeriod = "daily" | "weekly" | "monthly";

export interface TrendingOptions {
  period?: TrendingPeriod;   // default: "weekly"
  language?: string;         // e.g. "typescript"
  minStars?: number;         // default: 20
  limit?: number;            // default: 30
}

// ── Helpers ──────────────────────────────────────────────────────────

function getGitHubToken(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { stdio: ["pipe", "pipe", "pipe"] })
      .toString()
      .trim() || undefined;
  } catch {
    return undefined;
  }
}

// GitHub topics to search
const TOPICS_TO_SEARCH = [
  "llm", "mcp", "ai-agent", "rag", "vector-search",
  "embedding", "claude", "anthropic", "langchain",
];

// Topic -> domain mapping
const TOPIC_DOMAIN_MAP: Record<string, string> = {
  "llm": "ai-framework", "mcp": "agent", "ai-agent": "agent",
  "rag": "ai-framework", "vector-search": "vector", "embedding": "vector",
  "claude": "agent", "anthropic": "ai-sdk", "langchain": "ai-framework",
};

interface GitHubRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
  has_issues: boolean;
  topics: string[];
  html_url: string;
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

function deriveDomain(topics: string[]): string {
  for (const topic of topics) {
    if (TOPIC_DOMAIN_MAP[topic]) return TOPIC_DOMAIN_MAP[topic];
  }
  return "ai-framework";
}

function isRecentlyActive(pushedAt: string, maxMonths = 6): boolean {
  const pushed = new Date(pushedAt).getTime();
  const cutoff = Date.now() - maxMonths * 30 * 24 * 60 * 60 * 1000;
  return pushed > cutoff;
}

async function searchGitHub(topic: string, minStars = 50, page = 1): Promise<ExtendedManifestEntry[]> {
  const token = getGitHubToken();
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "agents-cli/1.0",
  };
  if (token) headers["Authorization"] = `token ${token}`;

  const url = `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&per_page=30&page=${page}`;

  let data: GitHubSearchResponse;
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      if (res.status === 403) console.warn(`  GitHub rate limit hit for topic: ${topic}`);
      return [];
    }
    data = await res.json() as GitHubSearchResponse;
  } catch {
    return [];
  }

  const results: ExtendedManifestEntry[] = [];

  for (const repo of data.items) {
    // Quality gates
    if (repo.stargazers_count < minStars) continue;
    if (!isRecentlyActive(repo.pushed_at)) continue;
    if (!repo.description) continue;

    const domain = deriveDomain([topic, ...(repo.topics ?? [])]);
    const name = repo.full_name.split("/")[1] ?? "unknown";

    results.push({
      domain,
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      repo: repo.full_name,
      description: repo.description.slice(0, 200),
      auto_discovered: true,
      quality_score: Math.min(1.0, repo.stargazers_count / 10000),
      classifier_source: "rules",
    });
  }

  return results;
}

/**
 * Discover GitHub trending repos using the Search API with date-range filters.
 *
 * Approximates GitHub's trending page by filtering on `pushed:>DATE` + `sort=stars`.
 * Period mapping: daily=1d, weekly=7d, monthly=30d lookback.
 */
export async function discoverTrendingRepos(opts?: TrendingOptions): Promise<ExtendedManifestEntry[]> {
  const period = opts?.period ?? "weekly";
  const minStars = opts?.minStars ?? 20;
  const limit = opts?.limit ?? 30;
  const language = opts?.language;

  const daysBack = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const cutoffDate = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

  // Build query: stars:>N pushed:>DATE [language:LANG]
  let q = `stars:>${minStars} pushed:>${cutoffDate}`;
  if (language) q += ` language:${language}`;

  const token = getGitHubToken();
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "agents-cli/1.0",
  };
  if (token) headers["Authorization"] = `token ${token}`;

  const all: ExtendedManifestEntry[] = [];
  const seen = new Set<string>();
  const perPage = Math.min(limit, 100);
  const pages = Math.ceil(limit / perPage);

  for (let page = 1; page <= pages; page++) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}&page=${page}`;

    let data: GitHubSearchResponse;
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        if (res.status === 403) console.warn("  GitHub rate limit hit for trending search");
        break;
      }
      data = await res.json() as GitHubSearchResponse;
    } catch {
      break;
    }

    for (const repo of data.items) {
      if (all.length >= limit) break;
      if (seen.has(repo.full_name)) continue;
      if (!repo.description) continue;
      if (!isRecentlyActive(repo.pushed_at, 3)) continue;

      seen.add(repo.full_name);
      const domain = deriveDomain(repo.topics ?? []);
      const name = repo.full_name.split("/")[1] ?? "unknown";

      all.push({
        domain,
        name: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        repo: repo.full_name,
        description: repo.description.slice(0, 200),
        auto_discovered: true,
        quality_score: Math.min(1.0, repo.stargazers_count / 10000),
        classifier_source: "rules",
      });
    }

    if (all.length >= limit) break;
    // Respect rate limits between pages
    await new Promise(r => setTimeout(r, 500));
  }

  return all;
}

/**
 * Discover GitHub repositories by query string or across AI-relevant topics.
 * When query is provided, searches GitHub directly for that query.
 */
export async function discoverGitHubRepos(query?: string, limit = 50): Promise<ExtendedManifestEntry[]> {
  const all: ExtendedManifestEntry[] = [];
  const seen = new Set<string>();

  if (query) {
    // Direct search mode: search GitHub for the given query
    const token = getGitHubToken();
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "agents-cli/1.0",
    };
    if (token) headers["Authorization"] = `token ${token}`;

    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${Math.min(limit, 100)}`;

    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
      if (res.ok) {
        const data = await res.json() as GitHubSearchResponse;
        for (const repo of data.items) {
          if (all.length >= limit) break;
          if (!repo.description) continue;
          if (seen.has(repo.full_name)) continue;
          seen.add(repo.full_name);

          const domain = deriveDomain(repo.topics ?? []);

          all.push({
            domain,
            name: repo.full_name,
            repo: repo.full_name,
            description: repo.description.slice(0, 200),
            auto_discovered: true,
            quality_score: Math.min(1.0, repo.stargazers_count / 10000),
            classifier_source: "rules",
          });
        }
      }
    } catch { /* timeout or network error */ }
  } else {
    // Topic group mode: search across all predefined topics
    for (const topic of TOPICS_TO_SEARCH) {
      const results = await searchGitHub(topic, 50);
      for (const entry of results) {
        if (!seen.has(entry.repo)) {
          seen.add(entry.repo);
          all.push(entry);
        }
      }
      // Respect GitHub rate limits
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return all.slice(0, limit);
}
