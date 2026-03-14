/**
 * GitHub GraphQL connector for paginated repository discovery.
 *
 * Uses the GitHub GraphQL API to discover repositories beyond the
 * REST API's 1000 result limit. Supports cursor-based pagination
 * and query point cost tracking.
 *
 * Requires GITHUB_TOKEN env var for authentication.
 * Rate limit: 5000 points/hour for authenticated requests.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface GraphQLRepo {
  nameWithOwner: string;
  description: string;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string } | null;
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
  licenseInfo: { spdxId: string } | null;
  updatedAt: string;
  isArchived: boolean;
}

export interface GraphQLSearchResult {
  repos: GraphQLRepo[];
  cursor: string | null;
  hasNextPage: boolean;
  totalCount: number;
  costUsed: number;
}

export interface CrawlCursor {
  query: string;
  cursor: string | null;
  page: number;
  totalFetched: number;
}

// ── Cost tracking ──────────────────────────────────────────────────────

let _pointsUsed = 0;
let _pointsResetAt = 0;
const POINTS_LIMIT = 4500; // Leave buffer below 5000

export function getPointsUsed(): number {
  if (Date.now() > _pointsResetAt) {
    _pointsUsed = 0;
    _pointsResetAt = Date.now() + 3_600_000;
  }
  return _pointsUsed;
}

export function getPointsRemaining(): number {
  return POINTS_LIMIT - getPointsUsed();
}

// ── GraphQL queries ────────────────────────────────────────────────────

const SEARCH_REPOS_QUERY = `
  query SearchRepos($query: String!, $first: Int!, $after: String) {
    search(query: $query, type: REPOSITORY, first: $first, after: $after) {
      repositoryCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Repository {
          nameWithOwner
          description
          url
          stargazerCount
          forkCount
          primaryLanguage { name }
          repositoryTopics(first: 10) {
            nodes { topic { name } }
          }
          licenseInfo { spdxId }
          updatedAt
          isArchived
        }
      }
    }
    rateLimit {
      cost
      remaining
      resetAt
    }
  }
`;

// ── API call ───────────────────────────────────────────────────────────

async function graphqlRequest(
  query: string,
  variables: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN or GH_TOKEN env var required for GitHub GraphQL API");
  }

  if (getPointsRemaining() < 10) {
    throw new Error(`GitHub GraphQL rate limit exhausted (${_pointsUsed}/${POINTS_LIMIT} points used). Resets at ${new Date(_pointsResetAt).toISOString()}`);
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as Record<string, unknown>;

  // Track rate limit cost
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rateLimit = (result as any).data?.rateLimit;
  if (rateLimit) {
    _pointsUsed += rateLimit.cost ?? 1;
    _pointsResetAt = new Date(rateLimit.resetAt).getTime();
  }

  if (result.errors) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (result.errors as any[]).map((e) => e.message).join("; ");
    throw new Error(`GitHub GraphQL errors: ${msg}`);
  }

  return result;
}

// ── Search functions ───────────────────────────────────────────────────

/**
 * Search GitHub repos by topic, language, or keywords.
 * Supports cursor-based pagination beyond the REST API's 1000 limit.
 *
 * @param query - GitHub search query (e.g., "topic:mcp stars:>10")
 * @param opts - Pagination options
 * @returns Search results with cursor for next page
 */
export async function searchRepos(
  query: string,
  opts?: { cursor?: string | null; perPage?: number },
): Promise<GraphQLSearchResult> {
  const perPage = Math.min(opts?.perPage ?? 50, 100);

  const result = await graphqlRequest(SEARCH_REPOS_QUERY, {
    query,
    first: perPage,
    after: opts?.cursor ?? null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const search = (result as any).data.search;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rateLimit = (result as any).data.rateLimit;

  return {
    repos: (search.nodes ?? []).filter((n: GraphQLRepo | null) => n && !n.isArchived),
    cursor: search.pageInfo.endCursor,
    hasNextPage: search.pageInfo.hasNextPage,
    totalCount: search.repositoryCount,
    costUsed: rateLimit?.cost ?? 1,
  };
}

/**
 * Crawl all repos matching a topic, paginating through results.
 * Yields pages of repos for streaming processing.
 *
 * @param topic - GitHub topic (e.g., "mcp", "cli-tool")
 * @param opts - Max pages and minimum stars filter
 */
export async function* crawlTopicRepos(
  topic: string,
  opts?: { maxPages?: number; minStars?: number; cursor?: string | null },
): AsyncGenerator<GraphQLSearchResult> {
  const minStars = opts?.minStars ?? 5;
  const maxPages = opts?.maxPages ?? 20;
  const query = `topic:${topic} stars:>=${minStars} sort:stars-desc`;

  let cursor = opts?.cursor ?? null;
  let page = 0;

  while (page < maxPages) {
    const result = await searchRepos(query, { cursor });
    yield result;

    if (!result.hasNextPage || result.repos.length === 0) break;
    cursor = result.cursor;
    page++;

    // Safety: check rate limit
    if (getPointsRemaining() < 20) break;
  }
}

/**
 * Discover repos by multiple topics in parallel.
 * Returns deduplicated results merged from all topic queries.
 */
export async function discoverByTopics(
  topics: string[],
  opts?: { perTopic?: number; minStars?: number },
): Promise<GraphQLRepo[]> {
  const perTopic = opts?.perTopic ?? 100;
  const seen = new Set<string>();
  const results: GraphQLRepo[] = [];

  // Process topics sequentially to respect rate limits
  for (const topic of topics) {
    if (getPointsRemaining() < 20) break;

    try {
      const minStars = opts?.minStars ?? 5;
      const query = `topic:${topic} stars:>=${minStars} sort:stars-desc`;
      const page = await searchRepos(query, { perPage: Math.min(perTopic, 100) });

      for (const repo of page.repos) {
        if (!seen.has(repo.nameWithOwner)) {
          seen.add(repo.nameWithOwner);
          results.push(repo);
        }
      }
    } catch {
      // Skip failed topics
    }
  }

  return results;
}

// ── Conversion to crawl queue items ────────────────────────────────────

/**
 * Convert GraphQL repos to crawl queue items.
 */
export function reposToCrawlItems(repos: GraphQLRepo[]): Array<{
  source: string;
  registry: string;
  priority: number;
  metadata: Record<string, unknown>;
}> {
  return repos.map((repo) => ({
    source: repo.nameWithOwner,
    registry: "github",
    priority: Math.min(Math.floor(Math.log2(repo.stargazerCount + 1) * 5), 100),
    metadata: {
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      language: repo.primaryLanguage?.name,
      topics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
      license: repo.licenseInfo?.spdxId,
      updatedAt: repo.updatedAt,
    },
  }));
}

/**
 * Save crawl cursor for resumable crawling.
 * Returns a serializable cursor object.
 */
export function saveCursor(query: string, cursor: string | null, page: number, totalFetched: number): CrawlCursor {
  return { query, cursor, page, totalFetched };
}
