import type { ToolResolver, ResolveResult, ToolMeta, SourceFormat } from "./types.js";
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { rejectPathTraversal } from "./guards.js";

/** Private/reserved IP ranges that should not be followed via redirects (SSRF protection) */
const PRIVATE_IP_PATTERNS = [
  /^127\./, // loopback
  /^10\./, // class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // class B private
  /^192\.168\./, // class C private
  /^169\.254\./, // link-local
  /^0\./, // current network
  /^\[::1\]/, // IPv6 loopback
  /^\[fc/, // IPv6 unique local
  /^\[fd/, // IPv6 unique local
  /^\[fe80:/, // IPv6 link-local
];

/** Check if a URL points to a private/internal IP address */
export function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (host === "localhost" || host === "[::1]") return true;
    return PRIVATE_IP_PATTERNS.some((p) => p.test(host));
  } catch {
    return false;
  }
}

/** Pattern matchers for source format detection */
const FORMAT_PATTERNS: ReadonlyArray<{ pattern: RegExp; format: SourceFormat }> = [
  { pattern: /^pypi:/, format: "pypi" },
  { pattern: /^crates:/, format: "crates" },
  { pattern: /^npm:/, format: "npm" },
  { pattern: /^@[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, format: "npm" },
  { pattern: /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, format: "github" },
  { pattern: /^https?:\/\/github\.com\//, format: "github" },
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

const MAX_REDIRECTS = 10;
const MAX_JSON_SIZE = 1 * 1024 * 1024; // 1MB for JSON responses

/** Fetch JSON from a URL (follows redirects, with SSRF and size protection) */
export function fetchJson(url: string, redirectCount = 0): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error(`Too many redirects (>${MAX_REDIRECTS}) for ${url}`));
      return;
    }
    if (isPrivateUrl(url)) {
      reject(new Error(`Refusing to fetch private/internal URL: ${url}`));
      return;
    }
    const getter = url.startsWith("https") ? httpsGet : httpGet;
    getter(url, { headers: { "User-Agent": "agents-cli/0.1.0", Accept: "application/json" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
          reject(new Error(`Refusing non-HTTP redirect to: ${redirectUrl}`));
          return;
        }
        fetchJson(redirectUrl, redirectCount + 1).then(resolve, reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      // Check Content-Length if available (NaN-safe)
      const contentLength = parseInt(res.headers["content-length"] ?? "", 10);
      if (!isNaN(contentLength) && contentLength > MAX_JSON_SIZE) {
        res.destroy();
        reject(new Error(`Response too large (${contentLength} bytes, max ${MAX_JSON_SIZE}) from ${url}`));
        return;
      }
      let data = "";
      let received = 0;
      let settled = false;
      res.on("data", (chunk: Buffer) => {
        if (settled) return;
        received += chunk.length;
        if (received > MAX_JSON_SIZE) {
          settled = true;
          res.destroy();
          reject(new Error(`Response exceeded size limit (${MAX_JSON_SIZE} bytes) from ${url}`));
          return;
        }
        data += chunk.toString();
      });
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

/** Try to get latest version from GitHub releases or tags */
async function fetchGithubVersion(owner: string, repo: string): Promise<string | undefined> {
  try {
    // Try latest release first
    const release = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/releases/latest`) as Record<string, unknown>;
    const tag = (release.tag_name as string) ?? "";
    if (tag) return tag.replace(/^v/, "");
  } catch {
    // No releases — try tags
    try {
      const tags = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/tags?per_page=1`) as unknown[];
      if (Array.isArray(tags) && tags.length > 0) {
        const tagName = (tags[0] as Record<string, unknown>).name as string;
        if (tagName) return tagName.replace(/^v/, "");
      }
    } catch { /* no tags either */ }
  }
  return undefined;
}

/** Fetch metadata from GitHub API */
async function resolveGithub(input: string): Promise<{ meta: Partial<ToolMeta>; ref?: string }> {
  const parsed = parseGithubOwnerRepo(input);
  if (!parsed) return { meta: {} };

  try {
    const data = await fetchJson(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`) as Record<string, unknown>;
    // Fetch version from releases/tags (best-effort, non-blocking on failure)
    const version = await fetchGithubVersion(parsed.owner, parsed.repo);
    return {
      meta: {
        name: (data.name as string) ?? parsed.repo,
        version: version ?? undefined,
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
  const raw = input.startsWith("npm:") ? input.slice(4) : input;
  const pkg = raw.startsWith("@") ? raw : raw.split("/").pop() ?? raw;
  try {
    // npm registry expects @scope%2fpkg format for scoped packages
    const encodedPkg = pkg.startsWith("@")
      ? `@${encodeURIComponent(pkg.slice(1))}`
      : encodeURIComponent(pkg);
    const data = await fetchJson(`https://registry.npmjs.org/${encodedPkg}`) as Record<string, unknown>;
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

/** Parse a PyPI package name from a pypi: prefixed input */
export function parsePypiPackage(input: string): string {
  const pkg = input.replace(/^pypi:/, "");
  if (!pkg || !/^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/.test(pkg)) {
    throw new Error(`Invalid PyPI package name: ${pkg}`);
  }
  return pkg;
}

/**
 * Normalize a PyPI license field to a short SPDX-like identifier.
 * PyPI's `info.license` often contains the full license text instead of
 * a short identifier. Fall back to extracting from trove classifiers.
 */
export function normalizePypiLicense(
  rawLicense: unknown,
  classifiers: unknown,
): string | undefined {
  const raw = typeof rawLicense === "string" ? rawLicense.trim() : "";
  // Short enough to be an SPDX identifier (e.g. "MIT", "Apache-2.0", "BSD-3-Clause")
  if (raw && raw.length <= 64 && !raw.includes("\n")) return raw;

  // Extract from trove classifiers: "License :: OSI Approved :: MIT License" → "MIT"
  if (Array.isArray(classifiers)) {
    for (const c of classifiers) {
      if (typeof c !== "string") continue;
      const m = (c as string).match(/^License\s*::\s*OSI Approved\s*::\s*(.+)/);
      if (m) {
        // "MIT License" → "MIT", "Apache Software License" → "Apache-2.0"
        const name = m[1]!.trim().replace(/\s+License$/i, "");
        if (name === "Apache Software") return "Apache-2.0";
        if (name === "GNU General Public") return "GPL-3.0";
        if (name === "GNU Lesser General Public") return "LGPL-3.0";
        if (name === "BSD") return "BSD-3-Clause";
        return name;
      }
    }
  }

  // Last resort: try to identify from the full text
  if (raw.length > 64) {
    if (/\bMIT\b/.test(raw)) return "MIT";
    if (/Apache License[\s\S]*2\.0/i.test(raw)) return "Apache-2.0";
    if (/BSD\s+3-Clause/i.test(raw)) return "BSD-3-Clause";
    if (/BSD\s+2-Clause/i.test(raw)) return "BSD-2-Clause";
    if (/GNU General Public License/i.test(raw)) return "GPL-3.0";
    if (/Mozilla Public License/i.test(raw)) return "MPL-2.0";
    if (/\bISC\b/.test(raw)) return "ISC";
  }

  return raw || undefined;
}

/** Fetch metadata from PyPI JSON API */
async function resolvePypi(input: string): Promise<{ meta: Partial<ToolMeta>; version?: string }> {
  const pkg = parsePypiPackage(input);
  try {
    const data = await fetchJson(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`) as Record<string, unknown>;
    const info = data.info as Record<string, unknown> | undefined;
    if (!info) return { meta: { name: pkg, tags: [] } };
    return {
      meta: {
        name: (info.name as string) ?? pkg,
        version: (info.version as string) ?? "",
        description: (info.summary as string) ?? "",
        homepage: (info.home_page as string) || (info.project_url as string) || undefined,
        license: normalizePypiLicense(info.license, info.classifiers),
        tags: Array.isArray(info.keywords)
          ? info.keywords as string[]
          : typeof info.keywords === "string" && info.keywords
            ? (info.keywords as string).split(/[,\s]+/).filter(Boolean)
            : [],
      },
      version: (info.version as string) ?? undefined,
    };
  } catch {
    return { meta: { name: pkg, tags: [] } };
  }
}

/** Parse a crate name from a crates: prefixed input */
export function parseCratesPackage(input: string): string {
  const pkg = input.replace(/^crates:/, "");
  if (!pkg || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(pkg)) {
    throw new Error(`Invalid crate name: ${pkg}`);
  }
  return pkg;
}

/** Fetch metadata from crates.io API */
async function resolveCrates(input: string): Promise<{ meta: Partial<ToolMeta>; version?: string }> {
  const pkg = parseCratesPackage(input);
  try {
    const data = await fetchJson(`https://crates.io/api/v1/crates/${encodeURIComponent(pkg)}`) as Record<string, unknown>;
    const crate = data.crate as Record<string, unknown> | undefined;
    if (!crate) return { meta: { name: pkg, tags: [] } };
    return {
      meta: {
        name: (crate.name as string) ?? pkg,
        version: (crate.max_version as string) ?? "",
        description: (crate.description as string) ?? "",
        homepage: (crate.homepage as string) || (crate.repository as string) || undefined,
        license: undefined,
        tags: Array.isArray(crate.categories) ? crate.categories as string[] : [],
      },
      version: (crate.max_version as string) ?? undefined,
    };
  } catch {
    return { meta: { name: pkg, tags: [] } };
  }
}

/** Resolve a local directory tool by reading its package.json */
function resolveLocal(input: string): { meta: Partial<ToolMeta>; version?: string } {
  rejectPathTraversal(input, "local tool path");
  const dir = resolve(input);
  const pkgPath = join(dir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      return {
        meta: {
          name: pkg.name ?? basename(dir),
          description: pkg.description,
          tags: pkg.keywords ?? [],
        },
        version: pkg.version,
      };
    } catch {
      // fall through to basename
    }
  }
  return { meta: { name: basename(dir), tags: [] } };
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
      } else if (format === "pypi") {
        const pypiResult = await resolvePypi(input);
        meta = pypiResult.meta;
        ref = pypiResult.version;
      } else if (format === "crates") {
        const cratesResult = await resolveCrates(input);
        meta = cratesResult.meta;
        ref = cratesResult.version;
      } else if (format === "local") {
        const localResult = resolveLocal(input);
        meta = localResult.meta;
        ref = localResult.version;
      }

      return {
        source: { format, uri: input, ref },
        meta,
      };
    },
  };
}
