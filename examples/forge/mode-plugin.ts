/**
 * forge/mode-plugin.ts — Build plugins, agent defs, and marketplace.
 * (Gap 5: --plugin, --agent-defs, --marketplace)
 */

import { join, resolve } from "node:path";
import { existsSync, readdirSync, readFileSync, mkdirSync } from "node:fs";
import { success, emit } from "../../lib/output.js";
import { parseFrontmatter } from "../../lib/skills.js";
import { groupByDomain } from "../../lib/indexes.js";
import type { ManifestEntry } from "../../lib/types.js";
import type { CliArgs } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log, atomicWrite } from "./helpers.js";

export async function pluginMode(args: CliArgs, startTime: number): Promise<void> {
  const { buildPlugins } = await import("../../lib/plugin/builder.js");

  log(`  Mode:     plugin`);
  if (args.domain) log(`  Domain:   ${args.domain}`);
  log(`  Dry run:  ${args.dryRun}`);
  log("");

  // Scan OUTPUT_DIR for SKILL.md files and build manifest
  const entries = scanSkillEntries();
  if (entries.length === 0) {
    log("  No skills found. Generate skills first.");
    return;
  }

  log(`  Found ${entries.length} skills across ${new Set(entries.map(e => e.domain)).size} domains`);

  // Write temporary manifest
  const manifestPath = resolve(OUTPUT_DIR, "skills-manifest.json");
  const pluginsDir = resolve(OUTPUT_DIR, "..", "plugins");

  if (!args.dryRun) {
    atomicWrite(manifestPath, JSON.stringify({ repos: entries }, null, 2));
    mkdirSync(pluginsDir, { recursive: true });

    await buildPlugins({
      manifestPath,
      pluginsDir,
      domain: args.domain || undefined,
      aiGenerate: args.ai,
    });

    log(`  Plugins written to: ${pluginsDir}/`);
  } else {
    log(`  Would write plugins to: ${pluginsDir}/`);
  }

  if (args.json) {
    emit(success("skill-forge:plugin", {
      skills: entries.length,
      domains: [...new Set(entries.map(e => e.domain))],
      pluginsDir,
      dryRun: args.dryRun,
    }, startTime), true);
  }
}

export async function agentDefsMode(args: CliArgs, startTime: number): Promise<void> {
  const { generateAgentDefs, defaultAgentDef } = await import("../../lib/plugin/ai-generator.js");

  log(`  Mode:   agent-defs`);
  if (args.domain) log(`  Domain: ${args.domain}`);
  log("");

  const entries = scanSkillEntries();
  if (entries.length === 0) {
    log("  No skills found.");
    return;
  }

  const byDomain = groupByDomain(entries);
  const targetDomains = args.domain
    ? [[args.domain, byDomain.get(args.domain) ?? []] as const]
    : [...byDomain.entries()];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const allDefs: Array<{ domain: string; agents: unknown[] }> = [];

  for (const [domain, domEntries] of targetDomains) {
    const pkgNames = domEntries.map(e => e.name);
    let agents;

    if (args.ai && apiKey) {
      try {
        agents = await generateAgentDefs(domain, pkgNames, apiKey);
      } catch {
        agents = [defaultAgentDef(domain)];
      }
    } else {
      agents = [defaultAgentDef(domain)];
    }

    allDefs.push({ domain, agents });
    log(`  ${domain}: ${agents.length} agent definition(s)`);
  }

  if (args.json) {
    emit(success("skill-forge:agent-defs", { definitions: allDefs }, startTime), true);
  }
}

export async function marketplaceMode(args: CliArgs, startTime: number): Promise<void> {
  const { generateMarketplace } = await import("../../lib/plugin/marketplace.js");

  log(`  Mode:   marketplace`);
  log(`  Dry run: ${args.dryRun}`);
  log("");

  const outDir = resolve(OUTPUT_DIR, "..", "marketplace");

  const result = await generateMarketplace({
    outputDir: outDir,
    config: {
      name: "agents-cli-skills",
      ownerName: "agents-cli",
      ownerEmail: "",
      version: "1.0.0",
      homepage: "",
      repository: "",
    },
    dryRun: args.dryRun,
  });

  log(`  Marketplace: ${result.pluginCount} plugins, ${result.skillCount} skills`);

  if (args.json) {
    emit(success("skill-forge:marketplace", result, startTime), true);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function scanSkillEntries(): ManifestEntry[] {
  const entries: ManifestEntry[] = [];

  if (!existsSync(OUTPUT_DIR)) return entries;

  for (const dir of readdirSync(OUTPUT_DIR)) {
    if (dir.startsWith("_") || dir.startsWith(".")) continue;
    const skillPath = join(OUTPUT_DIR, dir, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    try {
      const content = readFileSync(skillPath, "utf-8");
      const fm = parseFrontmatter(content);
      if (fm) {
        const domainMatch = content.match(/^domain:\s*(\S+)/m);
        entries.push({
          name: fm.name,
          repo: "",
          domain: domainMatch?.[1] ?? "uncategorized",
          description: fm.description ?? "",
        });
      }
    } catch { /* skip */ }
  }

  return entries;
}
