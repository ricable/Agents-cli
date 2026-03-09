/**
 * marketplace: Generate a Claude Code plugin marketplace directory.
 *
 * Produces a marketplace.json conforming to the Claude Code plugin marketplace
 * specification (https://code.claude.com/docs/en/plugin-marketplaces).
 *
 * Directory structure:
 *   marketplace/
 *   ├── marketplace.json        ← marketplace manifest
 *   └── plugins/
 *       ├── database/           ← plugin directory (self-contained)
 *       │   ├── .claude-plugin/plugin.json
 *       │   ├── skills/...
 *       │   └── agents/...
 *       └── devops/
 *           └── ...
 */

import fs from "node:fs";
import path from "node:path";
import { readPluginManifest, countPluginSkills, copyDirSafe } from "./shared.js";
import { toErrorMessage } from "../output.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface MarketplaceResult {
  pluginCount: number;
  skillCount: number;
  marketplacePath: string;
}

export interface MarketplaceConfig {
  name: string;
  ownerName: string;
  ownerEmail: string;
  version: string;
  homepage: string;
  repository: string;
}

export interface MarketplaceOptions {
  /** Output directory for marketplace files */
  outputDir: string;
  /** Marketplace configuration */
  config: MarketplaceConfig;
  /** Directory containing built plugins (from buildPlugins) */
  pluginsSourceDir?: string;
  /** Dry-run mode — preview without writing */
  dryRun?: boolean;
}

interface MarketplaceEntry {
  name: string;
  version: string;
  description: string;
  source: string;
  keywords?: string[];
}

interface MarketplaceManifest {
  name: string;
  version: string;
  description: string;
  owner: { name: string; email: string };
  homepage?: string;
  repository?: string;
  plugins: MarketplaceEntry[];
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Generate a Plugin Marketplace from built plugin directories.
 *
 * @param opts  Marketplace generation options
 * @returns     Summary of generated marketplace
 */
export async function generateMarketplace(
  opts: MarketplaceOptions
): Promise<MarketplaceResult> {
  const {
    outputDir,
    config,
    pluginsSourceDir,
    dryRun = false,
  } = opts;

  // Find source plugins
  const sourceDir = pluginsSourceDir ?? path.join(outputDir, "..", "plugins");
  if (!fs.existsSync(sourceDir)) {
    return { pluginCount: 0, skillCount: 0, marketplacePath: "" };
  }

  // Discover plugin directories
  const pluginDirs = fs.readdirSync(sourceDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(sourceDir, d.name))
    .filter(d => fs.existsSync(path.join(d, ".claude-plugin", "plugin.json")));

  if (pluginDirs.length === 0) {
    return { pluginCount: 0, skillCount: 0, marketplacePath: "" };
  }

  // Build marketplace entries
  const entries: MarketplaceEntry[] = [];
  let totalSkills = 0;

  for (const pluginDir of pluginDirs) {
    const manifest = readPluginManifest(pluginDir);
    if (!manifest) continue;

    entries.push({
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      source: `./plugins/${path.basename(pluginDir)}`,
      keywords: manifest.keywords.length > 0 ? manifest.keywords : undefined,
    });
    totalSkills += countPluginSkills(pluginDir);
  }

  // Build marketplace manifest
  const manifest: MarketplaceManifest = {
    name: config.name,
    version: config.version,
    description: `Plugin marketplace with ${entries.length} plugins and ${totalSkills} skills`,
    owner: {
      name: config.ownerName,
      email: config.ownerEmail,
    },
    ...(config.homepage ? { homepage: config.homepage } : {}),
    ...(config.repository ? { repository: config.repository } : {}),
    plugins: entries,
  };

  if (dryRun) {
    return {
      pluginCount: entries.length,
      skillCount: totalSkills,
      marketplacePath: outputDir,
    };
  }

  // Write marketplace directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Write marketplace.json
  const marketplacePath = path.join(outputDir, "marketplace.json");
  fs.writeFileSync(
    marketplacePath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  );

  // Copy plugins into marketplace/plugins/ with path containment
  const mktPluginsDir = path.join(outputDir, "plugins");
  fs.mkdirSync(mktPluginsDir, { recursive: true });

  for (const pluginDir of pluginDirs) {
    const destDir = path.join(mktPluginsDir, path.basename(pluginDir));
    try {
      // P0: Use safe copy that validates path containment and skips symlinks
      copyDirSafe(pluginDir, destDir, mktPluginsDir);
    } catch (err) {
      // Log but don't abort — skip corrupt plugins
      console.error(`WARN: skipping plugin ${path.basename(pluginDir)}: ${toErrorMessage(err)}`);
    }
  }

  return {
    pluginCount: entries.length,
    skillCount: totalSkills,
    marketplacePath,
  };
}
