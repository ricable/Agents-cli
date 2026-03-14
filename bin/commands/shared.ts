import { homedir } from "node:os";
import { join } from "node:path";

/** Shared data directory */
export const DATA_DIR: string = join(homedir(), ".agents-cli");

/** Detect JSON output mode: --json flag or OUTPUT_FORMAT=json env var */
export function isJsonMode(opts: { json?: boolean }): boolean {
  return opts.json === true || process.env.OUTPUT_FORMAT === "json";
}

/** Pick fields from an object (context window discipline — only return what agent needs) */
export function pickFields<T extends Record<string, unknown>>(obj: T, fields?: string): Partial<T> {
  if (!fields) return obj;
  const keys = fields.split(",").map(k => k.trim());
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key as keyof T];
  }
  return result as Partial<T>;
}

import type { UnifiedStore } from "../../lib/db/unified-store.js";

/** Initialize the unified SQLite store. Call in any command that needs DB access. */
export async function getStore(): Promise<UnifiedStore> {
  const { ensureSqlite } = await import("../../lib/db/sqlite.js");
  await ensureSqlite();
  const { createUnifiedStore } = await import("../../lib/db/unified-store.js");
  return createUnifiedStore(DATA_DIR);
}
