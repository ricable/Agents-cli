/**
 * Content-hash caching for skill-factory + file-level hash caching.
 *
 * Merged from core/src/lib/{cache, hash-cache}.
 *
 * - SkillCache: Tracks manifest-entry hash + repo HEAD sha per skill directory.
 *   Generation is skipped when both match, avoiding redundant work at scale.
 * - Hash-cache functions: Track per-file content hashes via better-sqlite3
 *   (lazily imported — only needed when hash caching is used).
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import type { ManifestEntry } from "./types.js";

// ── Cache entry & SkillCache ─────────────────────────────────────────────

export interface CacheEntry {
  manifestHash: string;
  repoSha: string;
  generatedAt: number;
}

type CacheData = Record<string, CacheEntry>;

export class SkillCache {
  private data: CacheData = {};
  private readonly filePath: string;

  constructor(skillsDir: string) {
    this.filePath = join(skillsDir, ".skill-cache.json");
    try {
      if (existsSync(this.filePath)) {
        this.data = JSON.parse(readFileSync(this.filePath, "utf-8")) as CacheData;
      }
    } catch {
      // Corrupted or unreadable cache — start empty
      this.data = {};
    }
  }

  get(key: string): CacheEntry | undefined {
    return this.data[key];
  }

  set(key: string, entry: CacheEntry): void {
    this.data[key] = entry;
  }

  save(): void {
    const dir = dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  /**
   * Removes cache entries whose keys are not in validKeys.
   * Returns the number of entries pruned.
   */
  prune(validKeys: string[]): number {
    const valid = new Set(validKeys);
    const orphans = Object.keys(this.data).filter((k) => !valid.has(k));
    for (const k of orphans) delete this.data[k];
    return orphans.length;
  }
}

/**
 * Deterministic hash of a manifest entry - changes when any field changes.
 */
export function manifestHash(entry: ManifestEntry): string {
  return createHash("sha1")
    .update(JSON.stringify(entry))
    .digest("hex")
    .slice(0, 8);
}

/**
 * Returns the short git HEAD sha for a cloned repo directory.
 * Returns "unknown" when git is unavailable or the directory is not a repo.
 */
export function getRepoHeadSha(repoDir: string): string {
  if (!existsSync(repoDir)) return "missing";
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repoDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

// ── File hash caching (better-sqlite3 gated behind lazy import) ──────────

interface FileHashEntry {
  path: string;
  hash: string;
  skill_mtime: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _dbPath: string | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _getSqlite: (() => any) | null = null;

async function loadSqlite(): Promise<void> {
  if (!_getSqlite) {
    const mod = await import("./db/sqlite.js");
    await mod.ensureSqlite();
    _getSqlite = mod.getSqlite;
  }
}

function getDb(dbPath: string): unknown {
  const resolvedPath = resolve(dbPath);
  if (!_db || _dbPath !== resolvedPath) {
    _db?.close();
    const Database = _getSqlite!();
    _db = new Database(resolvedPath);
    _dbPath = resolvedPath;
    _db.pragma("journal_mode = WAL");
    _db.pragma("synchronous = NORMAL");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS file_hashes (
        path TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        skill_mtime INTEGER NOT NULL
      )
    `);
  }
  return _db;
}

/**
 * Compute the SHA-256 hash of a file's content.
 */
export function computeFileHash(filePath: string): string {
  const content = readFileSync(resolve(filePath));
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Check if a file's content hash matches the stored hash.
 * Requires better-sqlite3 (call ensureHashCacheDb first).
 */
export async function isFileUnchanged(
  dbPath: string,
  filePath: string,
  currentHash: string,
): Promise<boolean> {
  await loadSqlite();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb(dbPath) as any;
  const row = db
    .prepare("SELECT hash FROM file_hashes WHERE path = ?")
    .get(filePath) as FileHashEntry | undefined;
  return row?.hash === currentHash;
}

/**
 * Record a file's content hash in the cache.
 * Requires better-sqlite3 (call ensureHashCacheDb first).
 */
export async function recordFileHash(
  dbPath: string,
  filePath: string,
  hash: string,
  skillMtime: number,
): Promise<void> {
  await loadSqlite();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb(dbPath) as any;
  db.prepare(
    "INSERT OR REPLACE INTO file_hashes (path, hash, skill_mtime) VALUES (?, ?, ?)",
  ).run(filePath, hash, skillMtime);
}

/**
 * Remove a file's hash from the cache.
 * Requires better-sqlite3 (call ensureHashCacheDb first).
 */
export async function clearFileHash(dbPath: string, filePath: string): Promise<void> {
  await loadSqlite();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb(dbPath) as any;
  db.prepare("DELETE FROM file_hashes WHERE path = ?").run(filePath);
}

/**
 * Close the hash cache database connection.
 */
export function closeHashCache(): void {
  _db?.close();
  _db = null;
  _dbPath = null;
}
