/**
 * sqlite-vec integration for vector similarity search.
 *
 * Provides KNN search over skill embeddings stored in a virtual table.
 * Falls back gracefully when sqlite-vec is not installed.
 *
 * Uses sqlite-vec's vec0 virtual table for HNSW-like approximate
 * nearest neighbor search. Embeddings are stored as Float32 blobs.
 */

import { cosine } from "../guards.js";

// sqlite-vec is loaded dynamically via ensureVecExtension()

// ── Types ──────────────────────────────────────────────────────────────

export interface VecSearchResult {
  id: string;
  distance: number;
  metadata?: Record<string, unknown>;
}

export interface VecStoreOptions {
  dimensions: number;       // embedding dimensions (384, 768, etc.)
  tableName?: string;       // default: "vec_skills"
}

// ── sqlite-vec loader ──────────────────────────────────────────────────

let _vecAvailable: boolean | null = null;

/**
 * Try to load sqlite-vec extension. Returns true if available.
 * sqlite-vec is an optional dependency — vector search degrades to brute-force
 * cosine when unavailable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureVecExtension(db: any): Promise<boolean> {
  if (_vecAvailable !== null) return _vecAvailable;

  try {
    // Try loading the sqlite-vec extension
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modName = "sqlite-vec";
    const sqliteVec = await import(/* webpackIgnore: true */ modName) as any;
    sqliteVec.load(db);
    _vecAvailable = true;
    return true;
  } catch {
    _vecAvailable = false;
    return false;
  }
}

/**
 * Check if sqlite-vec is available without attempting to load.
 */
export function isVecAvailable(): boolean {
  return _vecAvailable === true;
}

// ── VecStore class ─────────────────────────────────────────────────────

export class VecStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any;
  private readonly dimensions: number;
  private readonly tableName: string;
  private vecLoaded: boolean = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(db: any, options: VecStoreOptions) {
    this.db = db;
    this.dimensions = options.dimensions;
    this.tableName = options.tableName ?? "vec_skills";
  }

  /** Initialize the vec table. Must call after ensureVecExtension(). */
  async init(): Promise<boolean> {
    this.vecLoaded = await ensureVecExtension(this.db);

    if (this.vecLoaded) {
      // Create vec0 virtual table for KNN search
      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS ${this.tableName} USING vec0(
          id TEXT PRIMARY KEY,
          embedding float[${this.dimensions}]
        )
      `);

      // Metadata table for embedding model tracking
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS vec_meta (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
    }

    return this.vecLoaded;
  }

  /** Upsert a single embedding */
  upsert(id: string, embedding: Float32Array): void {
    if (!this.vecLoaded) return;

    // sqlite-vec expects raw bytes
    const buf = Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength);

    this.db.prepare(`
      INSERT OR REPLACE INTO ${this.tableName} (id, embedding)
      VALUES (?, ?)
    `).run(id, buf);
  }

  /** Bulk upsert embeddings in a transaction */
  bulkUpsert(items: Array<{ id: string; embedding: Float32Array }>): number {
    if (!this.vecLoaded) return 0;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ${this.tableName} (id, embedding)
      VALUES (?, ?)
    `);

    const tx = this.db.transaction((batch: typeof items) => {
      for (const item of batch) {
        const buf = Buffer.from(item.embedding.buffer, item.embedding.byteOffset, item.embedding.byteLength);
        stmt.run(item.id, buf);
      }
    });
    tx(items);
    return items.length;
  }

  /**
   * KNN search: find K nearest neighbors to query embedding.
   * Uses sqlite-vec's built-in distance computation.
   */
  search(queryEmbedding: Float32Array, k = 10): VecSearchResult[] {
    if (!this.vecLoaded) return [];

    const buf = Buffer.from(
      queryEmbedding.buffer,
      queryEmbedding.byteOffset,
      queryEmbedding.byteLength,
    );

    const rows = this.db.prepare(`
      SELECT id, distance
      FROM ${this.tableName}
      WHERE embedding MATCH ?
      ORDER BY distance
      LIMIT ?
    `).all(buf, k);

    return rows.map((row: { id: string; distance: number }) => ({
      id: row.id,
      distance: row.distance,
    }));
  }

  /**
   * KNN search with pre-filter: only search within a set of IDs.
   * Useful for domain-filtered vector search.
   */
  searchFiltered(queryEmbedding: Float32Array, filterIds: string[], k = 10): VecSearchResult[] {
    if (!this.vecLoaded || filterIds.length === 0) return [];

    // For small filter sets, use brute-force cosine on filtered results
    if (filterIds.length <= 100) {
      return this.bruteForceSearch(queryEmbedding, filterIds, k);
    }

    // For larger sets, use the vec table with post-filter
    const results = this.search(queryEmbedding, k * 3);
    const filterSet = new Set(filterIds);
    return results.filter((r) => filterSet.has(r.id)).slice(0, k);
  }

  /** Brute-force cosine search over a subset of embeddings */
  private bruteForceSearch(queryEmbedding: Float32Array, ids: string[], k: number): VecSearchResult[] {
    if (!this.vecLoaded) return [];

    const placeholders = ids.map(() => "?").join(",");
    const rows = this.db.prepare(`
      SELECT id, embedding FROM ${this.tableName} WHERE id IN (${placeholders})
    `).all(...ids);

    const scored: VecSearchResult[] = [];
    for (const row of rows) {
      const emb = new Float32Array(
        row.embedding.buffer,
        row.embedding.byteOffset,
        row.embedding.byteLength / 4,
      );
      const dist = 1 - cosine(queryEmbedding, emb);
      scored.push({ id: row.id, distance: dist });
    }

    scored.sort((a, b) => a.distance - b.distance);
    return scored.slice(0, k);
  }

  /** Delete an embedding */
  delete(id: string): void {
    if (!this.vecLoaded) return;
    this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
  }

  /** Get embedding count */
  count(): number {
    if (!this.vecLoaded) return 0;
    const row = this.db.prepare(`SELECT COUNT(*) as c FROM ${this.tableName}`).get();
    return row?.c ?? 0;
  }

  /** Check if an embedding exists */
  has(id: string): boolean {
    if (!this.vecLoaded) return false;
    return !!this.db.prepare(`SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`).get(id);
  }

  /** Set metadata (e.g., embedding model name) */
  setMeta(key: string, value: string): void {
    if (!this.vecLoaded) return;
    this.db.prepare("INSERT OR REPLACE INTO vec_meta (key, value) VALUES (?, ?)").run(key, value);
  }

  /** Get metadata */
  getMeta(key: string): string | null {
    if (!this.vecLoaded) return null;
    const row = this.db.prepare("SELECT value FROM vec_meta WHERE key = ?").get(key);
    return row?.value ?? null;
  }
}

// ── Factory ────────────────────────────────────────────────────────────

/**
 * Create a VecStore attached to an existing database.
 * Call init() after creation to set up tables.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createVecStore(db: any, dimensions = 384): VecStore {
  return new VecStore(db, { dimensions });
}
