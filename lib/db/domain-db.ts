/**
 * domain-db: Per-domain SQLite database factory.
 *
 * Each domain gets its own db/{domain}.sqlite.
 * Schema is identical across domains (rvf_chunks + FTS5).
 *
 * better-sqlite3 is lazily imported — install it only when indexing is needed.
 */

import fs from "node:fs";
import path from "node:path";
import { ensureSqlite, RVF_SCHEMA, applyWalPragmas } from "./sqlite.js";

const DB_DIR = path.resolve("db");

/** Re-export the Database instance type for consumers */
export type DatabaseInstance = import("better-sqlite3").Database;

/**
 * Ensure better-sqlite3 is available. Call before any DB operations.
 */
export async function ensureDb(): Promise<void> {
  await ensureSqlite();
}

// Cache of open database connections
const openDbs = new Map<string, DatabaseInstance>();

/**
 * Returns an open Database for the given domain.
 * Creates db/ directory and initializes schema on first access.
 * Caches open connections to avoid re-opening.
 *
 * Must call ensureDb() before first use (getDomainDb calls it internally).
 */
export async function getDomainDb(
  domain: string
): Promise<DatabaseInstance> {
  if (openDbs.has(domain)) return openDbs.get(domain)!;

  const Database = await ensureSqlite();

  fs.mkdirSync(DB_DIR, { recursive: true });
  const dbPath = path.join(DB_DIR, `${domain}.sqlite`);
  const db = new Database(dbPath);
  applyWalPragmas(db);
  db.exec(RVF_SCHEMA);
  openDbs.set(domain, db);
  return db;
}

/**
 * Returns the path to the domain SQLite file (may not exist yet).
 */
export function domainDbPath(domain: string): string {
  return path.join(DB_DIR, `${domain}.sqlite`);
}

/**
 * Close all open domain DBs (call at process exit or after bulk writes).
 */
export function closeAllDomainDbs(): void {
  for (const db of openDbs.values()) {
    db.close();
  }
  openDbs.clear();
}

/**
 * List of all defined domains.
 */
export const ALL_DOMAINS = [
  "agent",
  "ai-sdk",
  "ai-framework",
  "vector",
  "ml",
  "infra",
  "messaging",
  "validation",
  "testing",
  "web",
  "database",
  "runtime",
  "build",
  "observability",
  "auth",
  "queue",
  "state",
  "ui",
  "wasm",
] as const;

export type Domain = (typeof ALL_DOMAINS)[number];
