/**
 * github-classifier: Auto-discover repos from GitHub topics.
 *
 * Uses GitHub Search API to find repos tagged with AI/agent topics.
 * Applies quality gates: star count, recent activity, has issues.
 *
 * Requires GITHUB_TOKEN env var for higher rate limits (optional but recommended).
 */

import { execFileSync } from "node:child_process";
import { get as httpsGet } from "node:https";
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

// ── HTML Scraping: Trending Page ─────────────────────────────────────

/** A repo scraped from GitHub's trending page */
export interface TrendingRepo {
  owner: string;
  repo: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  url: string;
}

/** Fetch raw HTML from a URL, following redirects */
export function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { "User-Agent": "agents-cli/0.1.0", Accept: "text/html" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchHtml(res.headers.location).then(resolve, reject);
        return;
      }
      let data = "";
      res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/** Scrape GitHub's trending page HTML for repos */
export async function scrapeTrendingHtml(language: string, since: string): Promise<TrendingRepo[]> {
  const langPath = language ? `/${encodeURIComponent(language)}` : "";
  const url = `https://github.com/trending${langPath}?since=${since}`;

  const html = await fetchHtml(url);
  const repos: TrendingRepo[] = [];

  const articleRegex = /<article class="Box-row">([\s\S]*?)<\/article>/g;
  let match: RegExpExecArray | null;

  while ((match = articleRegex.exec(html)) !== null) {
    const block = match[1]!;
    const linkMatch = /href="\/([^/]+)\/([^/"]+)"/.exec(block);
    if (!linkMatch?.[1] || !linkMatch[2]) continue;

    const owner = linkMatch[1];
    const repo = linkMatch[2];

    const descMatch = /<p class="[^"]*?">([\s\S]*?)<\/p>/.exec(block);
    const description = descMatch?.[1]?.trim().replace(/<[^>]+>/g, "").replace(/\s+/g, " ") ?? "";

    const langMatch = /itemprop="programmingLanguage">([\s\S]*?)<\/span>/.exec(block);
    const lang = langMatch?.[1]?.trim() ?? "Unknown";

    const starsMatch = /(\d[\d,]*)\s*stars?\s*today/i.exec(block) ?? /href="\/[^"]*\/stargazers"[^>]*>\s*([\d,]+)/i.exec(block);
    const stars = starsMatch?.[1] ? parseInt(starsMatch[1].replace(/,/g, ""), 10) : 0;

    repos.push({ owner, repo, fullName: `${owner}/${repo}`, description, language: lang, stars, url: `https://github.com/${owner}/${repo}` });
  }

  return repos;
}

/** Heuristic: is this repo likely a CLI tool? */
export function isLikelyCli(repo: TrendingRepo): { likely: boolean; reason: string } {
  const desc = (repo.description + " " + repo.repo).toLowerCase();

  const cliKeywords = [
    "cli", "command-line", "command line", "terminal", "console",
    "tool", "utility", "linter", "formatter", "bundler", "compiler",
    "package manager", "task runner", "build tool", "dev tool",
    "shell", "prompt", "tui", "curses",
  ];

  for (const kw of cliKeywords) {
    if (desc.includes(kw)) return { likely: true, reason: `keyword: "${kw}"` };
  }

  if (["Rust", "Go"].includes(repo.language)) {
    const toolSuffixes = ["ctl", "sh", "cli", "tool", "ls", "cat", "grep", "find", "top", "stat"];
    for (const suffix of toolSuffixes) {
      if (repo.repo.toLowerCase().endsWith(suffix)) {
        return { likely: true, reason: `${repo.language} repo with tool-like name` };
      }
    }
  }

  const cliNamePatterns = [
    /^(go|py|node|rust)?-?\w+(ctl|sh|cli|tool)$/i,
    /^(n|bun|pnpm|yarn|deno|cargo|pip)$/i,
  ];
  for (const pattern of cliNamePatterns) {
    if (pattern.test(repo.repo)) return { likely: true, reason: "name pattern match" };
  }

  return { likely: false, reason: "no CLI signals detected" };
}

/** Fallback list of well-known CLI repos for when scraping fails */
export function getWellKnownCliRepos(): TrendingRepo[] {
  return [
    { owner: "BurntSushi", repo: "ripgrep", fullName: "BurntSushi/ripgrep", description: "ripgrep recursively searches directories for a regex pattern", language: "Rust", stars: 0, url: "https://github.com/BurntSushi/ripgrep" },
    { owner: "sharkdp", repo: "fd", fullName: "sharkdp/fd", description: "A simple, fast and user-friendly alternative to 'find'", language: "Rust", stars: 0, url: "https://github.com/sharkdp/fd" },
    { owner: "sharkdp", repo: "bat", fullName: "sharkdp/bat", description: "A cat(1) clone with wings", language: "Rust", stars: 0, url: "https://github.com/sharkdp/bat" },
    { owner: "junegunn", repo: "fzf", fullName: "junegunn/fzf", description: "A command-line fuzzy finder", language: "Go", stars: 0, url: "https://github.com/junegunn/fzf" },
    { owner: "jesseduffield", repo: "lazygit", fullName: "jesseduffield/lazygit", description: "simple terminal UI for git commands", language: "Go", stars: 0, url: "https://github.com/jesseduffield/lazygit" },
    { owner: "eza-community", repo: "eza", fullName: "eza-community/eza", description: "A modern replacement for ls", language: "Rust", stars: 0, url: "https://github.com/eza-community/eza" },
    { owner: "ajeetdsouza", repo: "zoxide", fullName: "ajeetdsouza/zoxide", description: "A smarter cd command", language: "Rust", stars: 0, url: "https://github.com/ajeetdsouza/zoxide" },
    { owner: "dandavison", repo: "delta", fullName: "dandavison/delta", description: "A syntax-highlighting pager for git, diff, and grep output", language: "Rust", stars: 0, url: "https://github.com/dandavison/delta" },
    { owner: "astral-sh", repo: "uv", fullName: "astral-sh/uv", description: "An extremely fast Python package and project manager", language: "Rust", stars: 0, url: "https://github.com/astral-sh/uv" },
    { owner: "astral-sh", repo: "ruff", fullName: "astral-sh/ruff", description: "An extremely fast Python linter and code formatter", language: "Rust", stars: 0, url: "https://github.com/astral-sh/ruff" },
    { owner: "biomejs", repo: "biome", fullName: "biomejs/biome", description: "A toolchain for web projects — formatter, linter", language: "Rust", stars: 0, url: "https://github.com/biomejs/biome" },
    { owner: "jqlang", repo: "jq", fullName: "jqlang/jq", description: "Command-line JSON processor", language: "C", stars: 0, url: "https://github.com/jqlang/jq" },
    { owner: "charmbracelet", repo: "glow", fullName: "charmbracelet/glow", description: "Render markdown on the CLI", language: "Go", stars: 0, url: "https://github.com/charmbracelet/glow" },
    { owner: "httpie", repo: "cli", fullName: "httpie/cli", description: "HTTPie CLI — human-friendly HTTP client for the API era", language: "Python", stars: 0, url: "https://github.com/httpie/cli" },
    { owner: "casey", repo: "just", fullName: "casey/just", description: "A command runner / simpler make alternative", language: "Rust", stars: 0, url: "https://github.com/casey/just" },
  ];
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
