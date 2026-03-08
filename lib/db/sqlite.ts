/**
 * Shared lazy-import for better-sqlite3.
 *
 * All modules that need SQLite should import from here to avoid
 * duplicating the dynamic import + error message pattern.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Database: any;

/**
 * Ensure better-sqlite3 is loaded. Call before any DB operations.
 * Returns the Database constructor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureSqlite(): Promise<any> {
  if (!Database) {
    try {
      const mod = await import("better-sqlite3");
      Database = mod.default ?? mod;
    } catch {
      throw new Error(
        "Install better-sqlite3 for database operations: npm i better-sqlite3"
      );
    }
  }
  return Database;
}

/**
 * Get the Database constructor synchronously (must call ensureSqlite first).
 * Throws if ensureSqlite hasn't been called yet.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSqlite(): any {
  if (!Database) {
    throw new Error("Call ensureSqlite() before getSqlite()");
  }
  return Database;
}

/** Shared schema for RVF chunks + FTS5 index. */
export const RVF_SCHEMA = `
  CREATE TABLE IF NOT EXISTS rvf_chunks (
    id          TEXT PRIMARY KEY,
    pkg         TEXT NOT NULL,
    file        TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content     TEXT NOT NULL,
    tokens      INTEGER NOT NULL,
    sha         TEXT NOT NULL,
    indexed_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pkg   ON rvf_chunks(pkg);
  CREATE INDEX IF NOT EXISTS idx_file  ON rvf_chunks(file);
  CREATE INDEX IF NOT EXISTS idx_sha   ON rvf_chunks(sha);

  CREATE VIRTUAL TABLE IF NOT EXISTS rvf_fts USING fts5(
    id UNINDEXED,
    pkg,
    file,
    content
  );
`;

/** Standard WAL pragmas for RVF databases. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyWalPragmas(db: any): void {
  db.pragma("journal_mode = WAL");
  db.pragma("page_size = 8192");
  db.pragma("synchronous = NORMAL");
  db.pragma("cache_size = -32000");
  db.pragma("busy_timeout = 60000");
}

/**
 * Upsert chunks into an RVF database (rvf_chunks + rvf_fts).
 * Runs in a transaction.
 */
export function upsertChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
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
  const insert = db.prepare(`
    INSERT OR REPLACE INTO rvf_chunks
      (id, pkg, file, chunk_index, content, tokens, sha, indexed_at)
    VALUES
      (@id, @pkg, @file, @chunk_index, @content, @tokens, @sha, @indexed_at)
  `);
  const deleteFTS = db.prepare(`DELETE FROM rvf_fts WHERE id = @id`);
  const insertFTS = db.prepare(`
    INSERT INTO rvf_fts (id, pkg, file, content)
    VALUES (@id, @pkg, @file, @content)
  `);

  const now = Date.now();
  const tx = db.transaction(
    (
      rows: Array<{
        id: string;
        pkg: string;
        file: string;
        chunk_index: number;
        content: string;
        tokens: number;
        sha: string;
      }>,
    ) => {
      for (const row of rows) {
        insert.run({ ...row, indexed_at: now });
        deleteFTS.run({ id: row.id });
        insertFTS.run({
          id: row.id,
          pkg: row.pkg,
          file: row.file,
          content: row.content,
        });
      }
    },
  );
  tx(chunks);
}
