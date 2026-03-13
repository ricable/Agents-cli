/**
 * cli-anything/app-detector.ts — Detects installed apps and builds AppProfile.
 *
 * On macOS: checks binaries in PATH, queries scriptability via osascript/sdef,
 * probes version strings. Falls back to registry metadata when app not installed.
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { getAppEntry } from "./registry.js";
import type { AppProfile, ApiEndpoint, AppRegistryEntry } from "./types.js";

/**
 * Find a binary in PATH, return its absolute path or empty string.
 */
function findBinary(names: string[]): string {
  for (const name of names) {
    try {
      const result = execSync(`which ${name} 2>/dev/null`, { encoding: "utf-8" }).trim();
      if (result) return result;
    } catch {
      // not found
    }
  }
  return "";
}

/**
 * Probe version from a binary.
 */
function probeVersion(binaryPath: string): string {
  if (!binaryPath) return "unknown";
  const flags = ["--version", "-v", "version"];
  for (const flag of flags) {
    try {
      const out = execSync(`"${binaryPath}" ${flag} 2>&1 | head -1`, {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();
      // Extract version number pattern
      const match = out.match(/(\d+\.\d+(?:\.\d+)?)/);
      if (match) return match[1]!;
    } catch {
      // try next flag
    }
  }
  return "unknown";
}

/**
 * Check macOS scriptability via sdef (Scripting Definition).
 */
function checkScriptability(appName: string): boolean {
  if (process.platform !== "darwin") return false;
  try {
    const appPath = `/Applications/${appName}.app`;
    if (!existsSync(appPath)) return false;
    execSync(`sdef "${appPath}" 2>/dev/null | head -1`, { encoding: "utf-8", timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Build default API endpoints from registry apiGroups.
 */
function buildDefaultApiSurface(entry: AppRegistryEntry): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  for (const group of entry.apiGroups) {
    // Generate common CRUD-like endpoints per group
    const actions = ["list", "create", "get", "update", "delete"];
    for (const action of actions) {
      endpoints.push({
        name: `${group}_${action}`,
        description: `${action} ${group}`,
        args: [{ name: "id", type: "string", required: action !== "list" && action !== "create", description: `${group} identifier` }],
        returnType: "object",
        group,
      });
    }
  }
  return endpoints;
}

/**
 * Analyze an application and produce an AppProfile.
 */
export function analyzeApp(appName: string): AppProfile {
  const entry = getAppEntry(appName);
  if (!entry) {
    // Unknown app — create minimal profile
    const binaryPath = findBinary([appName]);
    return {
      name: appName,
      displayName: appName.charAt(0).toUpperCase() + appName.slice(1),
      version: probeVersion(binaryPath),
      installed: binaryPath !== "",
      installHint: `Search for ${appName} at https://formulae.brew.sh/`,
      scriptable: false,
      backendType: "subprocess",
      apiSurface: [],
      bindings: [],
      category: "generic",
      binaryPath,
    };
  }

  const binaryPath = findBinary(entry.binaries);
  const installed = binaryPath !== "";
  const version = installed ? probeVersion(binaryPath) : "unknown";
  const scriptable = entry.scriptable || checkScriptability(entry.displayName);

  return {
    name: entry.name,
    displayName: entry.displayName,
    version,
    installed,
    installHint: entry.installHint,
    scriptable,
    backendType: entry.backendType,
    apiSurface: buildDefaultApiSurface(entry),
    bindings: entry.bindings,
    category: entry.category,
    binaryPath,
  };
}
