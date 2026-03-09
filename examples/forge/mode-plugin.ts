/**
 * forge/mode-plugin.ts — Build plugins, agent defs, and marketplace.
 *
 * Produces self-contained Claude Code plugins conforming to the official spec:
 *   https://code.claude.com/docs/en/plugins-reference
 */

import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { success, failure, emit } from "../../lib/output.js";
import { groupByDomain } from "../../lib/indexes.js";
import type { CliArgs } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log, atomicWrite, scanSkillEntries } from "./helpers.js";

export async function pluginMode(args: CliArgs, startTime: number): Promise<void> {
  const { buildPlugins } = await import("../../lib/plugin/builder.js");

  log(`  Mode:     plugin`);
  if (args.domain) log(`  Domain:   ${args.domain}`);
  log(`  Dry run:  ${args.dryRun}`);
  log("");

  // Scan OUTPUT_DIR for SKILL.md files and build manifest
  const entries = scanSkillEntries(OUTPUT_DIR);
  if (entries.length === 0) {
    log("  No skills found. Generate skills first.");
    if (args.json) {
      emit(failure("skill-forge:plugin", "NO_SKILLS", "No skills found", startTime), true);
    }
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
      skillsSourceDir: OUTPUT_DIR,
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
  const { generateAgentMarkdown, defaultAgentMarkdown } = await import("../../lib/plugin/ai-generator.js");

  log(`  Mode:   agent-defs`);
  if (args.domain) log(`  Domain: ${args.domain}`);
  log("");

  const entries = scanSkillEntries(OUTPUT_DIR);
  if (entries.length === 0) {
    log("  No skills found.");
    if (args.json) {
      emit(failure("skill-forge:agent-defs", "NO_SKILLS", "No skills found", startTime), true);
    }
    return;
  }

  const byDomain = groupByDomain(entries);
  const targetDomains = args.domain
    ? [[args.domain, byDomain.get(args.domain) ?? []] as const]
    : [...byDomain.entries()];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const allDefs: Array<{ domain: string; agents: Array<{ name: string }> }> = [];

  for (const [domain, domEntries] of targetDomains) {
    const pkgNames = domEntries.map(e => e.name);
    let agents: Array<{ name: string; content: string }>;

    if (args.ai && apiKey) {
      try {
        agents = await generateAgentMarkdown(domain, pkgNames, apiKey);
      } catch {
        agents = [defaultAgentMarkdown(domain, pkgNames)];
      }
    } else {
      agents = [defaultAgentMarkdown(domain, pkgNames)];
    }

    allDefs.push({ domain, agents: agents.map(a => ({ name: a.name })) });
    log(`  ${domain}: ${agents.length} agent(s)`);
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

  const pluginsDir = resolve(OUTPUT_DIR, "..", "plugins");
  const outDir = resolve(OUTPUT_DIR, "..", "marketplace");

  const result = await generateMarketplace({
    outputDir: outDir,
    pluginsSourceDir: pluginsDir,
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
  if (result.marketplacePath) {
    log(`  Output: ${result.marketplacePath}`);
  }

  if (args.json) {
    emit(success("skill-forge:marketplace", result, startTime), true);
  }
}
