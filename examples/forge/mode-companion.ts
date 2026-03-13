/**
 * forge/mode-companion.ts — Companion mode: NL description → complete plugin bundle.
 *
 * "FastAPI + PostgreSQL + React + AWS CI/CD" → tech profile → tool recommendations
 * → skill generation → plugin bundle with CLAUDE.md, hooks, agents.
 */

import { resolve } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { success, failure, emit } from "../../lib/output.js";
import { analyzeProject } from "../../lib/companion/analyzer.js";
import { mapToTools } from "../../lib/companion/mapper.js";
import type { ToolRecommendation } from "../../lib/companion/mapper.js";
import { processBatch, buildIndexes } from "./stages.js";
import { buildPlugins } from "../../lib/plugin/builder.js";
import type { CliArgs, BatchItem } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log, fmtTable, toolToManifestEntry, atomicWrite } from "./helpers.js";

export async function companionMode(args: CliArgs, startTime: number): Promise<void> {
  if (!args.prompt) {
    emit(failure("companion", "NO_PROMPT", "Usage: --companion \"describe your project\"", startTime), args.json);
    return;
  }

  // 1. Analyze project description
  log("  Analyzing project description...\n");
  const profile = analyzeProject(args.prompt);

  // Display tech profile
  const techRows = profile.techs.map(t => [
    t.name,
    t.layer,
    `${(t.confidence * 100).toFixed(0)}%`,
    t.variant ?? "",
  ]);
  if (techRows.length > 0) {
    log(fmtTable(techRows, ["Tech", "Layer", "Confidence", "Variant"]));
  } else {
    log("  No specific technologies detected in description.");
    log("  Tip: describe your stack, e.g. \"FastAPI + PostgreSQL + React + AWS\"");
    log("  For trending repos, use: --trending [--language rust] [--since weekly]");
  }
  log(`\n  Primary language: ${profile.primaryLanguage ?? "unknown"}`);
  log(`  Complexity:       ${profile.complexity}`);
  log(`  Intent:           ${profile.intent.intent} (${(profile.intent.confidence * 100).toFixed(0)}%)`);

  // 2. Map to tool recommendations
  log("\n  Mapping to CLI tools...\n");
  const projectRoot = resolve(".");
  const plan = mapToTools(profile, projectRoot);

  // Display recommendations table
  const recRows = plan.recommendations.map(r => [
    r.priority === "essential" ? "!!!" : r.priority === "recommended" ? " + " : "   ",
    r.name,
    r.source,
    r.priority,
    r.reason.slice(0, 50),
  ]);
  if (recRows.length > 0) {
    log(fmtTable(recRows, ["", "Name", "Source", "Priority", "Reason"]));
  }
  log(`\n  Summary: ${plan.summary.essential} essential, ${plan.summary.recommended} recommended, ${plan.summary.optional} optional (${plan.summary.total} total)`);

  // 3. Dry-run: stop here
  if (args.dryRun) {
    log("\n  [dry-run] Would generate skills and plugin bundle for the above tools.");
    emit(success("companion", {
      profile: {
        techs: profile.techs,
        primaryLanguage: profile.primaryLanguage,
        complexity: profile.complexity,
      },
      plan: {
        recommendations: plan.recommendations,
        summary: plan.summary,
        domains: plan.domains,
      },
    }, startTime), args.json);
    return;
  }

  // 4. Filter recommendations by priority and limit
  const filtered = filterRecommendations(plan.recommendations, args);
  log(`\n  Processing ${filtered.length} tools...`);

  // 5. Convert to BatchItems
  const items: BatchItem[] = filtered.map(rec => ({
    label: rec.name,
    source: rec.source,
    curatedMeta: rec.category
      ? { description: rec.reason, agentValue: rec.reason, category: rec.category }
      : undefined,
  }));

  // 6. Process batch
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outcome = await processBatch(items, {
    deep: args.deep,
    noCache: args.noCache,
    force: args.force,
    timeout: args.timeout,
    concurrency: args.concurrency,
  });

  log(`\n  Results: ${outcome.results.length} skills generated, ${outcome.failures.length} failures`);

  // 7. Build indexes
  if (outcome.results.length > 0) {
    const tools = outcome.results.map(r => r.tool);
    await buildIndexes(tools, false);
  }

  // 8. Build plugin bundle — generate a manifest from batch results first
  log("\n  Building plugin bundle...");
  const pluginsDir = resolve("examples/plugins");
  mkdirSync(pluginsDir, { recursive: true });

  if (outcome.results.length > 0) {
    // Generate skills-manifest.json from forged tools so buildPlugins() can read it.
    // Force all entries into "companion" domain so they group into a single plugin.
    const manifestEntries = outcome.results
      .map(r => toolToManifestEntry(r.tool))
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .map(e => ({ ...e, domain: "companion" }));
    const manifestPath = resolve("skills-manifest.json");
    atomicWrite(manifestPath, JSON.stringify({ repos: manifestEntries }, null, 2));

    try {
      const pluginResult = buildPlugins({
        full: args.full,
        manifestPath,
        skillsSourceDir: OUTPUT_DIR,
        pluginsDir,
      });
      log(`  Plugin built: ${pluginResult.skillsCopied ?? 0} skills, ${pluginResult.agentCount ?? 0} agents`);
    } catch (err) {
      log(`  WARN: Plugin build skipped (${err instanceof Error ? err.message : String(err)})`);
    }
  } else {
    log("  WARN: No skills generated — skipping plugin build");
  }

  // 9. Generate project-specific CLAUDE.md
  const companionPluginDir = resolve(pluginsDir, "companion");
  if (existsSync(companionPluginDir)) {
    const claudeMdPath = resolve(companionPluginDir, "CLAUDE.md");
    const claudeContent = generateProjectClaudeMd(profile, plan.recommendations);
    atomicWrite(claudeMdPath, claudeContent);
    log(`  Generated: ${claudeMdPath}`);
  }

  // 10. Summary
  const resultData = {
    profile: {
      techs: profile.techs.map(t => t.name),
      primaryLanguage: profile.primaryLanguage,
      complexity: profile.complexity,
    },
    generated: outcome.results.length,
    failures: outcome.failures.length,
    failedTools: outcome.failures.map(f => f.label),
  };

  log("\n  Companion mode complete.");
  emit(success("companion", resultData, startTime), args.json);
}

// ── Helpers ────────────────────────────────────────────────────────────

function filterRecommendations(
  recs: readonly ToolRecommendation[],
  args: CliArgs,
): ToolRecommendation[] {
  const result: ToolRecommendation[] = [];

  for (const rec of recs) {
    if (rec.priority === "essential") {
      result.push(rec);
    } else if (rec.priority === "recommended" && result.length < args.limit) {
      result.push(rec);
    } else if (rec.priority === "optional" && args.full) {
      result.push(rec);
    }
  }

  return result.slice(0, args.limit);
}

function generateProjectClaudeMd(
  profile: ReturnType<typeof analyzeProject>,
  recommendations: readonly ToolRecommendation[],
): string {
  const techList = profile.techs.map(t => `- **${t.name}** (${t.layer})`).join("\n");
  const essentialTools = recommendations
    .filter(r => r.priority === "essential")
    .map(r => `- \`${r.name}\` — ${r.reason}`)
    .join("\n");
  const recommendedTools = recommendations
    .filter(r => r.priority === "recommended")
    .map(r => `- \`${r.name}\` — ${r.reason}`)
    .join("\n");

  return `# Project Companion

## Tech Stack

${techList}

**Primary Language:** ${profile.primaryLanguage ?? "not detected"}
**Complexity:** ${profile.complexity}

## Essential Tools

${essentialTools || "None"}

## Recommended Tools

${recommendedTools || "None"}

## Quick Commands

\`\`\`bash
# Lint and format
${profile.primaryLanguage === "python" ? "ruff check . && ruff format ." : profile.primaryLanguage === "typescript" ? "biome check . --write" : "# configure for your language"}

# Run tests
${profile.primaryLanguage === "python" ? "pytest" : profile.primaryLanguage === "typescript" ? "vitest" : "# configure for your language"}

# Security scan
gitleaks detect --source .
\`\`\`
`;
}
