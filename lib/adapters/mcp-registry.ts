/**
 * MCP registry: discovers MCP servers from GitHub topics + npm search.
 *
 * Feeds MCPServerConfig[] into the mcp2cli adapter for processing.
 * Uses SSRF-safe fetching via fetchJson() and existing classifiers.
 */

import type { MCPServerConfig } from "./types.js";
import { discoverByTopics, type GraphQLRepo } from "../classifier/github-graphql.js";
import { searchLibrariesIo, type LibrariesIoPackage } from "../classifier/libraries-io.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface MCPDiscoveryOptions {
  /** GitHub topics to search (default: ["mcp-server", "model-context-protocol"]) */
  topics?: string[];
  /** npm search query (default: "mcp-server") */
  npmQuery?: string;
  /** Minimum GitHub stars for repos (default: 5) */
  minStars?: number;
  /** Max results per source (default: 50) */
  limit?: number;
}

export interface MCPDiscoveryResult {
  servers: MCPServerConfig[];
  sources: { github: number; npm: number };
}

// ── Discovery ──────────────────────────────────────────────────────────

/**
 * Discover MCP servers from GitHub topics and npm registry.
 * Returns MCPServerConfig[] for feeding into the mcp2cli adapter.
 */
export async function discoverMCPServers(
  opts?: MCPDiscoveryOptions,
): Promise<MCPDiscoveryResult> {
  const topics = opts?.topics ?? ["mcp-server", "model-context-protocol"];
  const npmQuery = opts?.npmQuery ?? "mcp-server";
  const minStars = opts?.minStars ?? 5;
  const limit = opts?.limit ?? 50;

  const seen = new Set<string>();
  const servers: MCPServerConfig[] = [];
  let githubCount = 0;
  let npmCount = 0;

  // 1. GitHub topic discovery
  try {
    const repos = await discoverByTopics(topics, { perTopic: limit, minStars });
    for (const repo of repos) {
      const config = repoToMCPConfig(repo);
      if (config && !seen.has(config.name)) {
        seen.add(config.name);
        servers.push(config);
        githubCount++;
      }
    }
  } catch {
    // GitHub discovery failed — continue with npm
  }

  // 2. npm search for mcp-server-* packages
  try {
    const packages = await searchLibrariesIo({
      query: npmQuery,
      registry: "npm",
      sort: "rank",
      limit,
    });
    for (const pkg of packages) {
      const config = npmToMCPConfig(pkg);
      if (config && !seen.has(config.name)) {
        seen.add(config.name);
        servers.push(config);
        npmCount++;
      }
    }
  } catch {
    // npm discovery failed
  }

  return {
    servers: servers.slice(0, limit),
    sources: { github: githubCount, npm: npmCount },
  };
}

// ── Converters ─────────────────────────────────────────────────────────

/**
 * Convert a GitHub repo to MCPServerConfig if it looks like an MCP server.
 */
function repoToMCPConfig(repo: GraphQLRepo): MCPServerConfig | null {
  const topics = repo.repositoryTopics.nodes.map((n) => n.topic.name);
  const isMCP = topics.some((t) => t === "mcp-server" || t === "model-context-protocol");
  if (!isMCP) return null;

  // Extract server name from repo name (e.g., "mcp-server-filesystem" → "filesystem")
  const repoName = repo.nameWithOwner.split("/")[1] ?? "";
  const serverName = repoName
    .replace(/^mcp-server-/, "")
    .replace(/^server-/, "")
    .replace(/^mcp-/, "");

  if (!serverName) return null;

  // Determine if npm-based (TypeScript/JavaScript) or Python-based
  const lang = repo.primaryLanguage?.name?.toLowerCase() ?? "";
  const isNode = lang === "typescript" || lang === "javascript";

  if (isNode) {
    // Try npm package naming convention
    const npmPackage = `@modelcontextprotocol/server-${serverName}`;
    return {
      name: serverName,
      command: "npx",
      args: ["-y", npmPackage],
      npmPackage,
      repo: repo.nameWithOwner,
    };
  }

  // Python-based or other: use uvx convention
  return {
    name: serverName,
    command: "uvx",
    args: [`mcp-server-${serverName}`],
    repo: repo.nameWithOwner,
  };
}

/**
 * Convert an npm package to MCPServerConfig if it matches MCP naming.
 */
function npmToMCPConfig(pkg: LibrariesIoPackage): MCPServerConfig | null {
  const name = pkg.name;
  // Match patterns: @modelcontextprotocol/server-*, mcp-server-*, @*/mcp-server-*
  const match = name.match(
    /^(?:@modelcontextprotocol\/server-|mcp-server-)(.+)$/,
  ) ?? name.match(/^@[^/]+\/mcp-server-(.+)$/);

  if (!match) return null;
  const serverName = match[1]!;

  return {
    name: serverName,
    command: "npx",
    args: ["-y", name],
    npmPackage: name,
  };
}
