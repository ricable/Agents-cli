import type { Tool, Lockfile, LockEntry } from "../types.js";
import { createHash } from "node:crypto";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

// =============================================================================
// Lockfile
// =============================================================================

/** Compute integrity hash for a lock entry */
export function computeIntegrity(sourceUri: string, version: string): string {
  return createHash("sha256")
    .update(`${sourceUri}@${version}`)
    .digest("hex");
}

/** Parse an agentcli.lock JSON string into a Lockfile object */
export function parseLockfile(content: string): Lockfile | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.version !== 1) return null;
    if (!Array.isArray(data.entries)) return null;
    if (typeof data.generatedAt !== "string") return null;

    const entries: LockEntry[] = [];
    for (const entry of data.entries as Record<string, unknown>[]) {
      if (
        typeof entry.id !== "string" ||
        typeof entry.version !== "string" ||
        typeof entry.integrity !== "string" ||
        !entry.source ||
        typeof entry.source !== "object"
      ) {
        return null;
      }
      const source = entry.source as Record<string, unknown>;
      if (typeof source.format !== "string" || typeof source.uri !== "string") {
        return null;
      }
      entries.push({
        id: entry.id,
        version: entry.version,
        source: {
          format: source.format as Tool["source"]["format"],
          uri: source.uri,
          ref: typeof source.ref === "string" ? source.ref : undefined,
          subpath: typeof source.subpath === "string" ? source.subpath : undefined,
        },
        integrity: entry.integrity,
      });
    }

    return {
      version: 1,
      entries,
      generatedAt: data.generatedAt as string,
    };
  } catch {
    return null;
  }
}

/** Generate a lockfile object from an array of installed tools */
export function generateLockfile(tools: Tool[]): Lockfile {
  const entries: LockEntry[] = tools.map((tool) => ({
    id: tool.id,
    version: tool.meta.version,
    source: tool.source,
    integrity: computeIntegrity(tool.source.uri, tool.meta.version),
  }));

  return {
    version: 1,
    entries,
    generatedAt: new Date().toISOString(),
  };
}

/** Write a lockfile to disk */
export function writeLockfile(lockPath: string, tools: Tool[]): void {
  const lockfile = generateLockfile(tools);
  writeFileSync(lockPath, JSON.stringify(lockfile, null, 2), "utf-8");
}

/** Read a lockfile from disk */
export function readLockfile(lockPath: string): Lockfile | null {
  if (!existsSync(lockPath)) return null;
  const content = readFileSync(lockPath, "utf-8");
  return parseLockfile(content);
}
