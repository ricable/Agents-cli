/**
 * aggregated-db: Cross-domain aggregated view using SQLite ATTACH.
 *
 * Opens agentdb.sqlite as the primary DB.
 * ATTACHes all existing domain DBs for cross-domain queries.
 *
 * better-sqlite3 is lazily imported — install it only when indexing is needed.
 */

import fs from "node:fs";
import path from "node:path";
import { ALL_DOMAINS, domainDbPath } from "./domain-db.js";
import { ensureSqlite, RVF_SCHEMA, applyWalPragmas, upsertChunks } from "./sqlite.js";
import type { DatabaseInstance } from "./domain-db.js";

const AGGREGATED_PATH = path.resolve("agentdb.sqlite");
const DB_DIR = path.resolve("db");

let _aggregatedDb: DatabaseInstance | null = null;

/**
 * Returns the open aggregated database, attaching all existing domain DBs.
 */
export async function getAggregatedDb(): Promise<DatabaseInstance> {
  if (_aggregatedDb) return _aggregatedDb;

  const Database = await ensureSqlite();

  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(AGGREGATED_PATH);
  applyWalPragmas(db);
  db.exec(RVF_SCHEMA);

  // Attach all existing domain DBs
  for (const domain of ALL_DOMAINS) {
    const dp = domainDbPath(domain);
    if (fs.existsSync(dp)) {
      const alias = domain.replace(/-/g, "_");
      try {
        db.exec(
          `ATTACH DATABASE '${dp.replace(/'/g, "''")}' AS "${alias}"`
        );
      } catch {
        // Already attached or not available — continue
      }
    }
  }

  _aggregatedDb = db;
  return db;
}

/**
 * Write chunks to the aggregated (agentdb.sqlite) database.
 * Re-exports the shared upsertChunks for convenience.
 */
export function upsertToAggregated(
  db: DatabaseInstance,
  chunks: Array<{
    id: string;
    pkg: string;
    file: string;
    chunk_index: number;
    content: string;
    tokens: number;
    sha: string;
  }>,
): void {
  upsertChunks(db, chunks);
}

/**
 * Close the aggregated database connection.
 */
export function closeAggregatedDb(): void {
  _aggregatedDb?.close();
  _aggregatedDb = null;
}

/**
 * Post-merge: copy all chunks from every domain DB into agentdb.sqlite in one pass.
 *
 * Fast path: bulk-insert into rvf_chunks first, then rebuild FTS5 in one pass.
 * This is 10-50x faster than per-row FTS5 delete+insert for large datasets.
 */
export async function mergeAllDomainsToAggregated(
  onProgress?: (domain: string, n: number) => void
): Promise<number> {
  const Database = await ensureSqlite();
  const agg = await getAggregatedDb();
  let total = 0;

  const PAGE = 5000;

  const insert = agg.prepare(`
    INSERT OR REPLACE INTO rvf_chunks
      (id, pkg, file, chunk_index, content, tokens, sha, indexed_at)
    VALUES
      (@id, @pkg, @file, @chunk_index, @content, @tokens, @sha, @indexed_at)
  `);

  const writePage = agg.transaction(
    (
      rows: Array<{
        id: string;
        pkg: string;
        file: string;
        chunk_index: number;
        content: string;
        tokens: number;
        sha: string;
        indexed_at: number;
      }>
    ) => {
      for (const row of rows) {
        insert.run(row);
      }
    }
  );

  // Phase 1: bulk-insert all chunks (skip FTS5 for now)
  for (const domain of ALL_DOMAINS) {
    const dbPath = domainDbPath(domain);
    if (!fs.existsSync(dbPath)) continue;

    const src = new Database(dbPath, { readonly: true });
    src.pragma("busy_timeout = 5000");

    const count = (
      src.prepare("SELECT COUNT(*) as n FROM rvf_chunks").get() as {
        n: number;
      }
    ).n;
    if (count === 0) {
      src.close();
      continue;
    }

    for (let offset = 0; offset < count; offset += PAGE) {
      const page = src
        .prepare("SELECT * FROM rvf_chunks LIMIT ? OFFSET ?")
        .all(PAGE, offset) as Array<{
        id: string;
        pkg: string;
        file: string;
        chunk_index: number;
        content: string;
        tokens: number;
        sha: string;
        indexed_at: number;
      }>;
      writePage(page);
      total += page.length;
    }

    src.close();
    onProgress?.(domain, count);
  }

  // Phase 2: rebuild FTS5 index in one shot
  agg.exec(`DELETE FROM rvf_fts`);
  agg.exec(`
    INSERT INTO rvf_fts (id, pkg, file, content)
    SELECT id, pkg, file, content FROM rvf_chunks
  `);

  agg.close();
  _aggregatedDb = null;
  return total;
}
