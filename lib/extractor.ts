/**
 * Repository content extraction utilities.
 *
 * Extracts README prose/code, TypeScript export groups, and package metadata
 * from cloned repos. Houses analyzeRepo() so skill-factory stays lean.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { ManifestEntry, PackageAnalysis, ExportGroup } from "./types.js";

// ── README helpers ───────────────────────────────────────────────────────

export function readReadme(repoDir: string): string {
  for (const name of ["README.md", "readme.md", "Readme.md"]) {
    try {
      return readFileSync(join(repoDir, name), "utf-8");
    } catch {
      /* not found or unreadable — try next */
    }
  }
  return "";
}

/**
 * Returns the first meaningful prose paragraph from a README,
 * skipping titles, badges, images, and HTML.
 */
export function extractReadmeExcerpt(readme: string, maxChars = 400): string {
  const prose: string[] = [];
  for (const line of readme.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("#")) continue;
    if (t.startsWith("!")) continue; // images
    if (t.startsWith("[!")) continue; // badges
    if (t.startsWith("<")) continue; // HTML
    if (t.startsWith("|")) continue; // tables
    if (t.startsWith("```")) continue; // code fences
    if (/^\[.*\]\(.*\)$/.test(t)) continue; // bare links
    prose.push(t);
    if (prose.join(" ").length >= maxChars) break;
  }
  return prose.join(" ").slice(0, maxChars);
}

/**
 * Extracts fenced TypeScript/JavaScript code blocks from markdown.
 * Returns up to maxBlocks blocks, each capped at maxChars characters.
 */
export function extractCodeBlocks(
  markdown: string,
  maxBlocks = 5,
  maxChars = 900,
): string[] {
  const blocks: string[] = [];
  const re = /```(?:typescript|ts|javascript|js)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null && blocks.length < maxBlocks) {
    const code = m[1]!.trim();
    if (code.length >= 20) blocks.push(code.slice(0, maxChars));
  }
  return blocks;
}

// ── TypeScript export extraction ─────────────────────────────────────────

/**
 * Parses a TypeScript source file and returns export groups.
 *
 * Handles two forms:
 *   export { Foo, type Bar, baz } from "./some/module.js"   -> re-exports
 *   export function/class/type/interface/const Foo           -> direct exports
 */
export function extractExportGroups(filePath: string): ExportGroup[] {
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const groups: ExportGroup[] = [];

  // Re-export blocks: export { ... } from "module"
  const reRe = /export\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = reRe.exec(content)) !== null) {
    const symbols = m[1]!
      .split(",")
      .map((s) => s.trim().replace(/^type\s+/, "").trim())
      .filter(Boolean);
    if (symbols.length === 0) continue;
    const modName = m[2]!.split("/").pop()?.replace(/\.(js|ts|mjs)$/, "") ?? m[2]!;
    const existing = groups.find((g) => g.module === modName);
    if (existing) existing.symbols.push(...symbols);
    else groups.push({ module: modName, symbols });
  }

  // Direct exports: export function/class/type/interface/const/enum Name
  const directRe = /^export\s+(?:async\s+)?(?:function|class|type|interface|const|enum)\s+(\w+)/gm;
  const direct: string[] = [];
  while ((m = directRe.exec(content)) !== null) {
    direct.push(m[1]!);
  }
  if (direct.length > 0) groups.unshift({ module: "(direct)", symbols: direct });

  return groups;
}

// ── Entry-point discovery ─────────────────────────────────────────────────

/**
 * Finds TypeScript entry-point files to extract API surface from.
 * Checks src/index.ts, lib/index.ts, and auto-discovers packages sub-dirs.
 */
export function findEntryPoints(repoDir: string, pkgName: string): string[] {
  const candidates: string[] = [
    "src/index.ts",
    "lib/index.ts",
    "index.ts",
    `packages/${pkgName}/src/index.ts`,
    `packages/${pkgName}/src/types.ts`,
  ];

  // Also auto-discover all packages/*/src/index.ts
  const pkgDir = join(repoDir, "packages");
  if (existsSync(pkgDir)) {
    try {
      for (const sub of readdirSync(pkgDir)) {
        const candidate = `packages/${sub}/src/index.ts`;
        if (!candidates.includes(candidate)) candidates.push(candidate);
      }
    } catch {
      /* skip */
    }
  }

  return candidates
    .map((c) => join(repoDir, c))
    .filter((p) => existsSync(p))
    .slice(0, 6);
}

// ── Full repo analysis ────────────────────────────────────────────────────

export function analyzeRepo(entry: ManifestEntry, rPath: string): PackageAnalysis {
  // When a subdir is specified (monorepo package/crate), analyse from that root
  const analysisRoot = entry.subdir ? join(rPath, entry.subdir) : rPath;

  let pkgName = entry.name;
  let version = "latest";
  let description = entry.description;
  let exports: string[] = [];
  let keywords: string[] = [];
  let hasTypes = false;

  for (const pkgPath of [
    join(analysisRoot, "package.json"),
    join(rPath, "package.json"),
    join(rPath, "packages", entry.name, "package.json"),
  ]) {
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        pkgName = pkg.name ?? pkgName;
        version = pkg.version ?? version;
        description = pkg.description || description;
        exports = Object.keys(pkg.exports ?? {}).slice(0, 10);
        keywords = (pkg.keywords ?? []).slice(0, 10);
        hasTypes = !!(pkg.types || pkg.typings || pkg.exports?.types);
      } catch {
        /* unreadable */
      }
      break;
    }
  }

  // Source file walk — prefer analysisRoot (subdir), fall back to repo root
  const mainFiles: string[] = [];
  for (const srcDir of ["src", "lib", "packages"]) {
    const dirPath = join(analysisRoot, srcDir);
    if (!existsSync(dirPath)) continue;
    try {
      const walk = (dir: string, depth = 0): string[] => {
        if (depth > 3) return [];
        return readdirSync(dir).flatMap((f) => {
          const full = join(dir, f);
          const rel = relative(rPath, full);
          if (statSync(full).isDirectory()) {
            const skip = [
              "node_modules",
              ".git",
              "dist",
              "build",
              "__tests__",
              "test",
              "tests",
              "spec",
              "fixtures",
            ];
            return skip.includes(f) ? [] : walk(full, depth + 1);
          }
          return /\.(ts|js|mjs|cjs|rs|go)$/.test(f) && !/\.test\.|\.spec\./.test(f) ? [rel] : [];
        });
      };
      mainFiles.push(...walk(dirPath));
      if (mainFiles.length > 20) break;
    } catch {
      /* unreadable */
    }
  }

  // README extraction — prefer subdir README, fall back to repo root
  const readme = readReadme(analysisRoot) || readReadme(rPath);
  const readmeExcerpt = extractReadmeExcerpt(readme);
  const codeExamples = extractCodeBlocks(readme);

  // Export groups from entry points
  const entryPoints = findEntryPoints(analysisRoot, pkgName);
  const exportGroups = entryPoints.flatMap((ep) => extractExportGroups(ep));

  // Deduplicate groups by module name
  const seen = new Map<string, ExportGroup>();
  for (const g of exportGroups) {
    const existing = seen.get(g.module);
    if (existing) existing.symbols.push(...g.symbols);
    else seen.set(g.module, { ...g });
  }

  return {
    pkgName,
    version,
    description,
    mainFiles: mainFiles.slice(0, 20),
    exports,
    keywords,
    hasTypes,
    repoUrl: `https://github.com/${entry.repo}`,
    readmeExcerpt,
    codeExamples,
    exportGroups: [...seen.values()],
  };
}
