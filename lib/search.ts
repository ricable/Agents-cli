/**
 * search: FTS5 + hybrid (vector re-rank) search over indexed source chunks.
 *
 * Supports three modes:
 *   - fts: keyword search via SQLite FTS5
 *   - hybrid: FTS pre-filter + cosine re-rank (requires embeddings)
 *   - vector: pure cosine scan (slow, requires embeddings)
 *
 * better-sqlite3 and @huggingface/transformers are lazily imported.
 */

import path from "node:path";
import { ensureSqlite } from "./db/sqlite.js";

// ── Public types ───────────────────────────────────────────────────────

export interface SearchOptions {
  query: string;
  pkg?: string;
  limit?: number;
  mode?: "fts" | "hybrid" | "vector";
  candidates?: number;
  dbPath?: string;
}

export interface SearchResult {
  id: string;
  pkg: string;
  file: string;
  chunkIndex: number;
  tokens: number;
  snippet: string;
  score?: number;
}

// ── Lazy imports ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqliteDb = any;

// ── Helpers ────────────────────────────────────────────────────────────

const OLLAMA_URL =
  typeof process !== "undefined"
    ? (process.env.OLLAMA_URL ?? "http://127.0.0.1:11434")
    : "http://127.0.0.1:11434";
const OLLAMA_MODEL = "nomic-embed-text";
const LOCAL_MODEL = "Xenova/all-MiniLM-L6-v2";

function fromBlob(buf: Buffer): Float32Array {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

async function embedViaOllama(text: string): Promise<Float32Array> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, input: [text] }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { embeddings?: number[][] };
  return new Float32Array(data.embeddings?.[0] ?? []);
}

function normalise(v: Float32Array): Float32Array {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm);
  return norm === 0 ? v : (v.map((x) => x / norm) as Float32Array);
}

// Cached ONNX pipeline — loading the model is expensive (seconds)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _cachedExtractor: any = null;

/** Embeds query using local ONNX model — no server required. */
async function embedViaLocal(text: string): Promise<Float32Array> {
  if (!_cachedExtractor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pipeline: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let env: any;
    try {
      // @ts-expect-error -- optional peer dependency, lazily loaded
      const mod = await import("@huggingface/transformers");
      pipeline = mod.pipeline;
      env = mod.env;
    } catch {
      throw new Error(
        "Install @huggingface/transformers for local embeddings: npm i @huggingface/transformers"
      );
    }
    if (!process.env.HF_HOME) {
      env.cacheDir = path.resolve("opensrc", ".hf-cache");
    }
    _cachedExtractor = await pipeline("feature-extraction", LOCAL_MODEL, {
      dtype: "fp32",
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out = (await _cachedExtractor([text], {
    pooling: "mean",
    normalize: true,
  })) as any;
  const dim = out.dims[out.dims.length - 1];
  const vec = new Float32Array(out.data.slice(0, dim));
  return normalise(vec);
}

/** Reads which model was used for indexing, if recorded. */
function getIndexModel(db: SqliteDb): string | null {
  try {
    const cols = db.prepare("PRAGMA table_info(embed_meta)").all() as any[];
    if (!cols.length) return null;
    const row = db
      .prepare("SELECT value FROM embed_meta WHERE key='model'")
      .get() as any;
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function embedQuery(
  text: string,
  db: SqliteDb
): Promise<Float32Array> {
  const indexModel = getIndexModel(db);
  const useOllama = indexModel?.includes("nomic") && !process.env.FORCE_LOCAL;

  if (useOllama) {
    try {
      return await embedViaOllama(text);
    } catch {
      /* fall through to local */
    }
  }

  return embedViaLocal(text);
}

function hasEmbeddings(db: SqliteDb): boolean {
  const cols = db.prepare("PRAGMA table_info(rvf_chunks)").all() as any[];
  if (!cols.find((c: any) => c.name === "embedding")) return false;
  const row = db
    .prepare(
      "SELECT COUNT(*) as n FROM rvf_chunks WHERE embedding IS NOT NULL"
    )
    .get() as any;
  return row.n > 0;
}

// ── FTS search ─────────────────────────────────────────────────────────

function ftsSearch(
  db: SqliteDb,
  q: string,
  pkg: string | undefined,
  n: number,
  withEmbedding = false
): any[] {
  const embCol = withEmbedding ? ", c.embedding" : "";
  let sql = `
    SELECT c.id, c.pkg, c.file, c.chunk_index, c.tokens${embCol},
           snippet(rvf_fts, 3, '>', '<', '...', 20) AS snippet
    FROM rvf_fts f
    JOIN rvf_chunks c ON c.id = f.id
    WHERE rvf_fts MATCH ?
  `;
  const params: unknown[] = [q];
  if (pkg) {
    sql += ` AND c.pkg = ?`;
    params.push(pkg);
  }
  sql += ` ORDER BY rank LIMIT ?`;
  params.push(n);
  return db.prepare(sql).all(...params) as any[];
}

// ── Pure vector scan ───────────────────────────────────────────────────

function vectorScan(
  db: SqliteDb,
  queryVec: Float32Array,
  pkg: string | undefined,
  n: number
): any[] {
  let sql = `SELECT id, pkg, file, chunk_index, tokens, embedding,
                    substr(content,1,300) AS snippet
             FROM rvf_chunks
             WHERE embedding IS NOT NULL`;
  const params: unknown[] = [];
  if (pkg) {
    sql += ` AND pkg = ?`;
    params.push(pkg);
  }

  const rows = db.prepare(sql).all(...params) as any[];
  return rows
    .map((r) => ({
      ...r,
      score: cosine(queryVec, fromBlob(r.embedding as Buffer)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

// ── Map raw DB rows to SearchResult ────────────────────────────────────

function toSearchResults(rows: any[]): SearchResult[] {
  return rows.map((r) => ({
    id: r.id,
    pkg: r.pkg,
    file: r.file,
    chunkIndex: r.chunk_index,
    tokens: r.tokens,
    snippet: String(r.snippet ?? "").replace(/\n/g, " ").slice(0, 300),
    score: r.score,
  }));
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Search indexed source chunks using FTS, hybrid, or vector mode.
 *
 * @param opts  Search options (query, pkg filter, limit, mode, etc.)
 * @returns     Array of matching search results
 */
export async function hybridSearch(
  opts: SearchOptions
): Promise<SearchResult[]> {
  const Database = await ensureSqlite();

  const {
    query,
    pkg,
    limit = 10,
    mode: modeArg,
    candidates = 100,
    dbPath,
  } = opts;

  if (!query) return [];

  const resolvedPath = dbPath ?? path.resolve("agentdb.sqlite");
  const db = new Database(resolvedPath, { readonly: true });

  try {
    const hasEmb = hasEmbeddings(db);

    // Auto-select mode
    const mode: "fts" | "hybrid" | "vector" = modeArg ?? (hasEmb ? "hybrid" : "fts");

    if ((mode === "hybrid" || mode === "vector") && !hasEmb) {
      // Fall back to FTS
      const rows = ftsSearch(db, query, pkg, limit);
      return toSearchResults(rows);
    }

    if (mode === "fts") {
      const rows = ftsSearch(db, query, pkg, limit);
      return toSearchResults(rows);
    }

    // Embed the query
    let queryVec: Float32Array;
    try {
      queryVec = await embedQuery(query, db);
    } catch {
      // Fall back to FTS
      const rows = ftsSearch(db, query, pkg, limit);
      return toSearchResults(rows);
    }

    if (mode === "vector") {
      const rows = vectorScan(db, queryVec, pkg, limit);
      return toSearchResults(rows);
    }

    // hybrid: FTS pre-filter -> cosine re-rank
    const candidateRows = ftsSearch(db, query, pkg, candidates, true);
    if (!candidateRows.length) return [];

    const reranked = candidateRows
      .filter((r) => r.embedding)
      .map((r) => ({
        ...r,
        score: cosine(queryVec, fromBlob(r.embedding as Buffer)),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const final =
      reranked.length > 0 ? reranked : candidateRows.slice(0, limit);
    return toSearchResults(final);
  } finally {
    db.close();
  }
}
