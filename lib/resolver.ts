import type { ToolResolver, ResolveResult, ToolMeta, SourceFormat } from "./types.js";
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";

/** Pattern matchers for source format detection */
const FORMAT_PATTERNS: ReadonlyArray<{ pattern: RegExp; format: SourceFormat }> = [
  { pattern: /^@[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, format: "npm" },
  { pattern: /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, format: "github" },
  { pattern: /^https?:\/\/github\.com\//, format: "github" },
  { pattern: /^https?:\/\/.*\.tar\.gz$/, format: "tarball" },
  { pattern: /^https?:\/\/.*\.tgz$/, format: "tarball" },
  { pattern: /^https?:\/\//, format: "url" },
  { pattern: /^git(\+https?|@)/, format: "git" },
  { pattern: /^(\.\/|\/|~\/)/, format: "local" },
];

/** Detect the source format from a raw input string */
export function detectFormat(input: string): SourceFormat | null {
  for (const { pattern, format } of FORMAT_PATTERNS) {
    if (pattern.test(input)) {
      return format;
    }
  }
  return null;
}

/** Fetch JSON from a URL (follows redirects) */
export function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith("https") ? httpsGet : httpGet;
    getter(url, { headers: { "User-Agent": "agents-cli/0.1.0", Accept: "application/json" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = "";
      res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Invalid JSON from ${url}`)); }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

/** Parse owner/repo from a GitHub input (URL or shorthand) */
export function parseGithubOwnerRepo(input: string): { owner: string; repo: string } | null {
  const urlMatch = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/.exec(input);
  if (urlMatch?.[1] && urlMatch[2]) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }
  const shortMatch = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/.exec(input);
  if (shortMatch?.[1] && shortMatch[2]) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }
  return null;
}

/** Fetch metadata from GitHub API */
async function resolveGithub(input: string): Promise<{ meta: Partial<ToolMeta>; ref?: string }> {
  const parsed = parseGithubOwnerRepo(input);
  if (!parsed) return { meta: {} };

  try {
    const data = await fetchJson(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`) as Record<string, unknown>;
    return {
      meta: {
        name: (data.name as string) ?? parsed.repo,
        description: (data.description as string) ?? "",
        homepage: (data.homepage as string) || (data.html_url as string) || undefined,
        license: (data.license as Record<string, unknown>)?.spdx_id as string | undefined,
        tags: Array.isArray(data.topics) ? data.topics as string[] : [],
      },
      ref: (data.default_branch as string) ?? "main",
    };
  } catch {
    return {
      meta: { name: parsed.repo, tags: [] },
      ref: "main",
    };
  }
}

/** Fetch metadata from npm registry */
async function resolveNpm(input: string): Promise<{ meta: Partial<ToolMeta>; version?: string }> {
  const pkg = input.startsWith("@") ? input : input.split("/").pop() ?? input;
  try {
    const data = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(pkg).replace("%40", "@")}`) as Record<string, unknown>;
    const latest = (data["dist-tags"] as Record<string, string> | undefined)?.latest ?? "";
    return {
      meta: {
        name: (data.name as string) ?? pkg,
        version: latest,
        description: (data.description as string) ?? "",
        homepage: (data.homepage as string) || undefined,
        license: (data.license as string) || undefined,
        tags: Array.isArray(data.keywords) ? data.keywords as string[] : [],
      },
      version: latest,
    };
  } catch {
    return { meta: { name: pkg, tags: [] } };
  }
}

/** Create a resolver instance */
export function createResolver(): ToolResolver {
  return {
    supports(input: string): boolean {
      return detectFormat(input) !== null;
    },

    async resolve(input: string): Promise<ResolveResult> {
      const format = detectFormat(input);
      if (!format) {
        throw new Error(`Cannot resolve source format for: ${input}`);
      }

      let meta: Partial<ToolMeta> = {};
      let ref: string | undefined;

      if (format === "github") {
        const ghResult = await resolveGithub(input);
        meta = ghResult.meta;
        ref = ghResult.ref;
      } else if (format === "npm") {
        const npmResult = await resolveNpm(input);
        meta = npmResult.meta;
        ref = npmResult.version;
      }

      return {
        source: { format, uri: input, ref },
        meta,
      };
    },
  };
}
