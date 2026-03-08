import type { ToolResolver, ResolveResult, SourceFormat } from "./types.js";

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

      return {
        source: { format, uri: input },
        meta: {},
      };
    },
  };
}
