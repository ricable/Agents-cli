/**
 * plugin-publisher: Package and publish domain plugins to npm.
 *
 * For each domain plugin in {pluginsDir}/{domain}/:
 *   1. Creates a package.json suitable for npm publishing
 *   2. Optionally runs npm publish --access public
 *   3. Updates {pluginsDir}/registry.json with published metadata
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// ── Types ──────────────────────────────────────────────────────────────

interface RegistryEntry {
  domain: string;
  package: string;
  version: string;
  publishedAt: string;
  skillCount: number;
}

// ── Internal helpers ───────────────────────────────────────────────────

function createPackageJson(domain: string, pluginDir: string): void {
  const pluginJson = JSON.parse(
    fs.readFileSync(path.join(pluginDir, "plugin.json"), "utf-8")
  ) as { name: string; version: string; description: string; skills: string[] };

  const pkgJson = {
    name: `@opensrc-skills/${domain}`,
    version: pluginJson.version,
    description: pluginJson.description,
    main: "plugin.json",
    keywords: [
      "claude-code",
      "skill",
      "plugin",
      domain,
      "ai",
      "opensrc",
    ],
    license: "MIT",
    author: "@ruvnet/pop-skills",
    repository: {
      type: "git",
      url: "https://github.com/ruvnet/pop-skills",
    },
    files: ["plugin.json", "skills/", "agents/", "hooks/", "commands/"],
    engines: { node: ">=18" },
    publishConfig: { access: "public" },
  };

  fs.writeFileSync(
    path.join(pluginDir, "package.json"),
    JSON.stringify(pkgJson, null, 2) + "\n",
    "utf-8"
  );
}

function updateRegistry(
  domain: string,
  pluginDir: string,
  pluginsDir: string
): void {
  const registryPath = path.join(pluginsDir, "registry.json");
  let registry: RegistryEntry[] = [];

  if (fs.existsSync(registryPath)) {
    registry = JSON.parse(
      fs.readFileSync(registryPath, "utf-8")
    ) as RegistryEntry[];
  }

  const pluginJson = JSON.parse(
    fs.readFileSync(path.join(pluginDir, "plugin.json"), "utf-8")
  ) as { version: string; skills: string[] };

  const existing = registry.findIndex((e) => e.domain === domain);
  const entry: RegistryEntry = {
    domain,
    package: `@opensrc-skills/${domain}`,
    version: pluginJson.version,
    publishedAt: new Date().toISOString(),
    skillCount: pluginJson.skills.length,
  };

  if (existing >= 0) {
    registry[existing] = entry;
  } else {
    registry.push(entry);
  }

  fs.writeFileSync(
    registryPath,
    JSON.stringify(registry, null, 2) + "\n",
    "utf-8"
  );
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Publish a single domain plugin to npm.
 *
 * @param domain     Domain name (e.g. "agent")
 * @param dryRun     If true, runs npm pack instead of npm publish
 * @param pluginsDir Directory containing plugin subdirectories
 */
export async function publishPlugin(
  domain: string,
  dryRun = false,
  pluginsDir?: string
): Promise<void> {
  const resolvedDir = pluginsDir ?? path.resolve("plugins");
  const pluginDir = path.join(resolvedDir, domain);

  if (!fs.existsSync(pluginDir)) {
    throw new Error(
      `Plugin directory not found: ${pluginDir} -- run build-plugins first`
    );
  }

  if (!fs.existsSync(path.join(pluginDir, "plugin.json"))) {
    throw new Error(`plugin.json not found in ${pluginDir}`);
  }

  // Create publishable package.json
  createPackageJson(domain, pluginDir);

  if (dryRun) {
    try {
      execFileSync("npm", ["pack", "--dry-run"], {
        cwd: pluginDir,
        stdio: "pipe",
      });
    } catch {
      // Pack dry-run warning — non-fatal
    }
    return;
  }

  try {
    execFileSync("npm", ["publish", "--access", "public"], {
      cwd: pluginDir,
      stdio: "inherit",
    });

    // Update registry
    updateRegistry(domain, pluginDir, resolvedDir);
  } catch (e) {
    throw new Error(
      `Failed to publish ${domain}: ${(e as Error).message}`
    );
  }
}

/**
 * Publish all domain plugins.
 *
 * @param dryRun       If true, runs npm pack instead of npm publish
 * @param domainFilter Only publish this domain (optional)
 * @param pluginsDir   Directory containing plugin subdirectories
 */
export async function publishAllPlugins(
  dryRun = false,
  domainFilter?: string,
  pluginsDir?: string
): Promise<void> {
  const resolvedDir = pluginsDir ?? path.resolve("plugins");

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(
      "plugins/ directory not found -- run build-plugins first"
    );
  }

  const domains = fs
    .readdirSync(resolvedDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((d) => !domainFilter || d === domainFilter);

  for (const domain of domains) {
    await publishPlugin(domain, dryRun, resolvedDir);
  }
}
