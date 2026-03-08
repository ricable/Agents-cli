/**
 * plugin-builder: Build Claude Code plugin packages per domain.
 *
 * Reads a skills manifest, groups entries by domain, and for each domain
 * creates plugins/{domain}/plugin.json with the required structure.
 *
 * If aiGenerate is true and ANTHROPIC_API_KEY is set, calls generateAgentDefs()
 * from ai-generator to produce AI-enhanced agent definitions.
 */

import fs from "node:fs";
import path from "node:path";
import { generateAgentDefs, defaultAgentDef } from "./ai-generator.js";
import type { AgentDef } from "./ai-generator.js";
import type { ManifestEntry } from "../types.js";

export type { AgentDef };

export interface PluginJson {
  name: string;
  version: string;
  description: string;
  domain: string;
  skills: string[];
  agents: AgentDef[];
}

export interface BuildPluginsOptions {
  /** Only build the plugin for this domain (optional) */
  domain?: string;
  /** Use Claude Haiku to generate agent definitions */
  aiGenerate?: boolean;
  /** Root directory containing skills-manifest.json and plugins/ output */
  rootDir?: string;
  /** Path to the manifest file (overrides rootDir-based discovery) */
  manifestPath?: string;
  /** Output directory for plugins (overrides rootDir/plugins) */
  pluginsDir?: string;
}

interface Manifest {
  repos: ManifestEntry[];
}

/**
 * Build domain plugins from a skills manifest.
 *
 * @param opts  Build options
 */
export async function buildPlugins(opts?: BuildPluginsOptions): Promise<void> {
  const {
    domain: domainFilter,
    aiGenerate = false,
    rootDir,
    manifestPath: manifestPathOpt,
    pluginsDir: pluginsDirOpt,
  } = opts ?? {};

  const root = rootDir ?? process.cwd();
  const pluginsDir = pluginsDirOpt ?? path.resolve(root, "plugins");
  const manifestPath =
    manifestPathOpt ?? path.resolve(root, "skills-manifest.json");

  const raw = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as Manifest;

  // Group entries by domain
  const byDomain = new Map<string, ManifestEntry[]>();
  for (const entry of manifest.repos) {
    if (domainFilter && entry.domain !== domainFilter) continue;
    if (!byDomain.has(entry.domain)) byDomain.set(entry.domain, []);
    byDomain.get(entry.domain)!.push(entry);
  }

  fs.mkdirSync(pluginsDir, { recursive: true });

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";

  for (const [dom, entries] of byDomain) {
    const pluginDir = path.join(pluginsDir, dom);
    fs.mkdirSync(pluginDir, { recursive: true });

    // Skill paths: .claude/skills/src-{name}/SKILL.md
    const skills = entries.map((e) => {
      const skillName = e.name.startsWith("src-") ? e.name : `src-${e.name}`;
      return `.claude/skills/${skillName}/SKILL.md`;
    });

    // Agent definitions
    let agents: AgentDef[];

    if (aiGenerate && apiKey) {
      const pkgNames = entries.map((e) => e.name);
      agents = await generateAgentDefs(dom, pkgNames, apiKey);
    } else {
      agents = [defaultAgentDef(dom)];
    }

    const pluginJson: PluginJson = {
      name: `src-index-${dom}`,
      version: "1.0.0",
      description: `Claude Code skills for ${dom} domain packages`,
      domain: dom,
      skills,
      agents,
    };

    fs.writeFileSync(
      path.join(pluginDir, "plugin.json"),
      JSON.stringify(pluginJson, null, 2) + "\n",
      "utf-8"
    );
  }
}
