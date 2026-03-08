/**
 * indexer: opensrc -> RVF chunk indexer (library version).
 *
 * Parses fetched opensrc packages into RuVector RVF chunks
 * stored in per-domain SQLite databases.
 *
 * better-sqlite3 and fast-glob are lazily imported.
 */

import fs from "node:fs";
import path from "node:path";

// ── Public types ───────────────────────────────────────────────────────

export interface IndexOptions {
  sourceDirs: string[];
  domain?: string;
  flat?: boolean;
  dbPath?: string;
}

export interface IndexResult {
  totalChunks: number;
  packages: number;
}

// ── Internal types ─────────────────────────────────────────────────────

interface RVFChunk {
  id: string;
  pkg: string;
  file: string;
  chunk_index: number;
  content: string;
  tokens: number;
  sha: string;
}

interface SourceIndex {
  sources?: Array<{ name: string; path?: string; version?: string }>;
  repos?: Array<{
    name: string;
    path: string;
    version?: string;
    fetchedAt?: string;
  }>;
  packages?: Array<{
    name: string;
    path: string;
    version?: string;
    fetchedAt?: string;
  }>;
}

import { ensureSqlite, RVF_SCHEMA, applyWalPragmas, upsertChunks } from "./db/sqlite.js";
import { lineBasedChunk } from "./chunker.js";

// ── Lazy imports ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqliteDb = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureFastGlob(): Promise<any> {
  try {
    const mod = await import("fast-glob");
    return mod.default ?? mod;
  } catch {
    throw new Error("Install fast-glob for indexing: npm i fast-glob");
  }
}

// ── Config constants ───────────────────────────────────────────────────

const EXTS = ["ts", "js", "mjs", "cjs", "json", "md"];
const MAX_FILE_BYTES = 200_000; // skip files > 200 KB

const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/out/**",
  "**/*.d.ts",
  "**/*.min.js",
  "**/*.min.mjs",
  "**/*-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",
  "**/*.map",
  "**/coverage/**",
  "**/__snapshots__/**",
];

// ── DB bootstrap ───────────────────────────────────────────────────────

function initDB(db: SqliteDb): void {
  applyWalPragmas(db);
  db.exec(RVF_SCHEMA);
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Index source directories into RVF chunks stored in SQLite.
 *
 * @param opts  Indexing options
 * @returns     Summary of indexed chunks and packages
 */
export async function indexSources(opts: IndexOptions): Promise<IndexResult> {
  const { sourceDirs, domain, flat = false, dbPath } = opts;

  const Database = await ensureSqlite();
  const fg = await ensureFastGlob();

  // Open or create the target database
  let db: SqliteDb;

  if (domain && !flat) {
    // Import domain-db for sharded mode
    const { getDomainDb } = await import("./db/domain-db.js");
    db = await getDomainDb(domain);
  } else {
    const resolvedPath = dbPath ?? path.resolve("agentdb.sqlite");
    db = new Database(resolvedPath);
    initDB(db);
  }

  let totalChunks = 0;
  let packageCount = 0;

  for (const sourceDir of sourceDirs) {
    if (!fs.existsSync(sourceDir)) continue;

    // Discover packages from sources.json or directory scan
    let entries: Array<{ pkg: string; dir: string }> = [];
    const sourcesPath = path.join(sourceDir, "sources.json");

    if (fs.existsSync(sourcesPath)) {
      const idx: SourceIndex = JSON.parse(
        fs.readFileSync(sourcesPath, "utf-8")
      );
      const items = [
        ...(idx.repos ?? []),
        ...(idx.packages ?? []),
        ...(idx.sources ?? []),
      ];
      entries = items.map((s) => ({
        pkg: s.name.split("/").pop() ?? s.name,
        dir: s.path
          ? path.join(sourceDir, s.path)
          : path.join(sourceDir, s.name),
      }));
    } else {
      const dirs = fs
        .readdirSync(sourceDir)
        .filter((d) => fs.statSync(path.join(sourceDir, d)).isDirectory());
      entries = dirs.map((d) => ({
        pkg: d,
        dir: path.join(sourceDir, d),
      }));
    }

    for (const { pkg, dir: pkgDir } of entries) {
      const pattern = `${pkgDir}/**/*.{${EXTS.join(",")}}`;
      const files = await fg(pattern, { ignore: IGNORE_PATTERNS });

      const chunks: RVFChunk[] = [];
      for (const f of files) {
        try {
          const stat = fs.statSync(f);
          if (stat.size > MAX_FILE_BYTES) continue;
          const raw = fs.readFileSync(f as string, "utf-8");
          const astChunks = lineBasedChunk(raw, pkg, path.relative(sourceDir, f as string));
          for (const c of astChunks) {
            chunks.push({
              id: c.id,
              pkg: c.pkg,
              file: c.file,
              chunk_index: c.chunk_index,
              content: c.content,
              tokens: c.tokens,
              sha: c.sha,
            });
          }
        } catch {
          /* binary / unreadable */
        }
      }

      if (chunks.length > 0) {
        upsertChunks(db, chunks);
        totalChunks += chunks.length;
        packageCount++;
      }
    }
  }

  // Close flat DB (domain DBs are managed by domain-db module)
  if (flat || !domain) {
    db.close();
  }

  return {
    totalChunks,
    packages: packageCount,
  };
}
