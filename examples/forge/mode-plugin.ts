/**
 * forge/mode-plugin.ts — Build plugins, agent defs, and marketplace.
 *
 * Produces self-contained Claude Code plugins conforming to the official spec:
 *   https://code.claude.com/docs/en/plugins-reference
 */

import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
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

  const manifestPath = resolve(OUTPUT_DIR, "skills-manifest.json");
  const pluginsDir = resolve(OUTPUT_DIR, "..", "plugins");

  // Only write manifest when not in dry-run mode
  if (!args.dryRun) {
    atomicWrite(manifestPath, JSON.stringify({ repos: entries }, null, 2));
  }

  const outputDir = args.outputDir || undefined;
  const finalPluginsDir = outputDir ? resolve(outputDir, "plugins") : pluginsDir;

  // P1: pass dryRun and full/multiRuntime into buildPlugins
  const result = await buildPlugins({
    manifestPath,
    pluginsDir: finalPluginsDir,
    domain: args.domain || undefined,
    aiGenerate: args.ai,
    skillsSourceDir: OUTPUT_DIR,
    dryRun: args.dryRun,
    full: args.full,
    multiRuntime: args.multiRuntime,
  });

  if (args.dryRun) {
    log(`  Would write ${result.pluginCount} plugins (${result.skillsCopied} skills) to: ${finalPluginsDir}/`);
  } else {
    log(`  Plugins written to: ${finalPluginsDir}/`);
    log(`  ${result.pluginCount} plugins, ${result.skillsCopied} skills copied`);
    if (result.hookCount) log(`  ${result.hookCount} hooks generated`);
    if (result.agentCount) log(`  ${result.agentCount} agents generated`);
    if (result.commandCount) log(`  ${result.commandCount} commands generated`);
  }

  // P2: Always emit JSON output (not just for dry-run)
  if (args.json) {
    emit(success("skill-forge:plugin", {
      skills: entries.length,
      pluginCount: result.pluginCount,
      skillsCopied: result.skillsCopied,
      domains: result.domains,
      pluginsDir,
      dryRun: args.dryRun,
      hookCount: result.hookCount ?? 0,
      agentCount: result.agentCount ?? 0,
      commandCount: result.commandCount ?? 0,
    }, startTime), true);
  }
}

export async function agentDefsMode(args: CliArgs, startTime: number): Promise<void> {
  const { generateAgentMarkdown, defaultAgentMarkdown } = await import("../../lib/plugin/ai-generator.js");

  log(`  Mode:   agent-defs`);
  if (args.domain) log(`  Domain: ${args.domain}`);
  log(`  Dry run: ${args.dryRun}`);
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
  const allDefs: Array<{ domain: string; agents: Array<{ name: string }>; outputDir?: string }> = [];

  // P1: Write agent markdown files to disk (into plugins/<domain>/agents/)
  const pluginsDir = resolve(OUTPUT_DIR, "..", "plugins");

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

    // Write agent files to plugin directory
    const flatDomain = domain.replace(/\//g, "-");
    const agentsDir = resolve(pluginsDir, flatDomain, "agents");

    if (!args.dryRun) {
      mkdirSync(agentsDir, { recursive: true });
      for (const agent of agents) {
        writeFileSync(
          resolve(agentsDir, `${agent.name}.md`),
          agent.content,
          "utf-8"
        );
      }
    }

    allDefs.push({
      domain,
      agents: agents.map(a => ({ name: a.name })),
      outputDir: agentsDir,
    });
    log(`  ${domain}: ${agents.length} agent(s)${args.dryRun ? " (dry-run)" : ` → ${agentsDir}`}`);
  }

  if (args.json) {
    emit(success("skill-forge:agent-defs", { definitions: allDefs, dryRun: args.dryRun }, startTime), true);
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
