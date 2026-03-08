import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Parsed package.json fields relevant to agents-cli */
export interface PkgInfo {
  readonly dir: string;
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly bin?: Record<string, string> | string;
  readonly main?: string;
  readonly scripts?: Record<string, string>;
  readonly raw: Record<string, unknown>;
}

/** Directories to skip when walking nested packages */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "vendor", "coverage"]);

/** Safely read and parse a package.json from a directory. Returns null on missing/error. */
export function readPkgJson(dir: string): PkgInfo | null {
  const pkgPath = join(dir, "package.json");
  try {
    const raw = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<string, unknown>;
    return {
      dir,
      name: typeof raw.name === "string" ? raw.name : undefined,
      version: typeof raw.version === "string" ? raw.version : undefined,
      description: typeof raw.description === "string" ? raw.description : undefined,
      bin: normalizeBin(raw.bin),
      main: typeof raw.main === "string" ? raw.main : undefined,
      scripts: isStringRecord(raw.scripts) ? raw.scripts : undefined,
      raw,
    };
  } catch {
    return null;
  }
}

/** Extract version from a package.json in dir, with fallback */
export function readPkgVersion(dir: string, fallback = "0.0.0"): string {
  const pkg = readPkgJson(dir);
  return pkg?.version ?? fallback;
}

/** Walk nested directories for package.json files, calling visitor for each. */
export function walkPackageDirs(
  dir: string,
  visitor: (pkg: PkgInfo) => boolean | void,
  maxDepth = 4,
  depth = 0,
): void {
  if (depth > maxDepth) return;

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);

    try {
      if (!statSync(full).isDirectory()) continue;
    } catch {
      continue;
    }

    const pkg = readPkgJson(full);
    if (pkg) {
      const stop = visitor(pkg);
      if (stop === true) return;
    }

    walkPackageDirs(full, visitor, maxDepth, depth + 1);
  }
}

function normalizeBin(bin: unknown): Record<string, string> | string | undefined {
  if (typeof bin === "string") return bin;
  if (typeof bin === "object" && bin !== null && !Array.isArray(bin)) {
    return bin as Record<string, string>;
  }
  return undefined;
}

function isStringRecord(v: unknown): v is Record<string, string> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
