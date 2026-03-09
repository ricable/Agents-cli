/**
 * plugin/shared.ts — Shared helpers for plugin system modules.
 *
 * Extracted to avoid duplication across builder.ts, marketplace.ts, publisher.ts.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Validate that a resolved path stays within a base directory.
 * Throws if the resolved path escapes the base.
 */
export function assertWithinDir(filePath: string, baseDir: string, label: string): void {
  const resolved = path.resolve(filePath);
  const base = path.resolve(baseDir);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error(`${label}: path "${filePath}" escapes base directory "${baseDir}"`);
  }
}

/**
 * Validate a name used in filesystem paths (skill names, domain names, agent names).
 * Blocks path traversal sequences and invalid characters.
 */
export function validatePluginName(name: string, label: string): void {
  if (name.includes("..") || name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new Error(`${label}: invalid name "${name}" — contains path traversal or separator characters`);
  }
  // Block names that start with . (hidden files)
  if (name.startsWith(".")) {
    throw new Error(`${label}: invalid name "${name}" — must not start with '.'`);
  }
}

/**
 * Read a plugin.json from a .claude-plugin directory and extract metadata.
 * Returns null if the manifest doesn't exist or is malformed.
 */
export function readPluginManifest(pluginDir: string): {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  license: string;
} | null {
  const manifestPath = path.join(pluginDir, ".claude-plugin", "plugin.json");
  if (!fs.existsSync(manifestPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Record<string, unknown>;
    return {
      name: String(raw.name ?? path.basename(pluginDir)),
      version: String(raw.version ?? "1.0.0"),
      description: String(raw.description ?? ""),
      keywords: Array.isArray(raw.keywords)
        ? (raw.keywords as unknown[]).map(String)
        : [],
      license: String(raw.license ?? "MIT"),
    };
  } catch {
    return null;
  }
}

/**
 * Count SKILL.md files within a plugin's skills/ directory.
 */
export function countPluginSkills(pluginDir: string): number {
  const skillsDir = path.join(pluginDir, "skills");
  if (!fs.existsSync(skillsDir)) return 0;

  let count = 0;
  for (const name of fs.readdirSync(skillsDir)) {
    const skillMd = path.join(skillsDir, name, "SKILL.md");
    if (fs.existsSync(skillMd)) count++;
  }
  return count;
}

/**
 * Recursively copy a directory, with path containment checks.
 * Only copies regular files and directories (skips symlinks for safety).
 */
export function copyDirSafe(src: string, dest: string, baseDir: string): void {
  assertWithinDir(dest, baseDir, "copyDirSafe dest");

  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip symlinks for security (they could point outside baseDir)
    if (entry.isSymbolicLink()) continue;

    // Validate destination stays within base
    assertWithinDir(destPath, baseDir, "copyDirSafe entry");

    if (entry.isDirectory()) {
      copyDirSafe(srcPath, destPath, baseDir);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
