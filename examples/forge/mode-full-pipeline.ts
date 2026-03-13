/**
 * forge/mode-full-pipeline.ts — End-to-end mega-command.
 *
 * Chains: CLI-Anything batch → plugins → agent defs → marketplace-v2 → audit → catalog summary.
 *
 * Usage:
 *   npx tsx examples/skill-forge.ts --full-pipeline [--dry-run] [--limit N] [--json]
 */

import type { CliArgs } from "./types.js";
import { log } from "./helpers.js";
import { success, failure, emit } from "../../lib/output.js";

interface PipelineSummary {
  phases: PhaseResult[];
  totals: {
    apps: number;
    commands: number;
    skills: number;
    plugins: number;
    agents: number;
    marketplaceProducts: number;
    auditPassed: number;
    auditTotal: number;
  };
  durationMs: number;
}

interface PhaseResult {
  phase: number;
  name: string;
  status: "ok" | "skipped" | "failed";
  durationMs: number;
  detail?: Record<string, unknown>;
}

export async function fullPipelineMode(args: CliArgs, startTime: number): Promise<void> {
  log("  Mode: Full Pipeline (end-to-end)");
  log("  ─────────────────────────────────");
  log("");

  const phases: PhaseResult[] = [];
  const totals: PipelineSummary["totals"] = {
    apps: 0,
    commands: 0,
    skills: 0,
    plugins: 0,
    agents: 0,
    marketplaceProducts: 0,
    auditPassed: 0,
    auditTotal: 0,
  };

  // ── Phase 1: CLI-Anything batch ──────────────────────────────────────

  const p1Start = Date.now();
  log("  Phase 1/6: CLI-Anything batch generation");
  try {
    const { listRegisteredApps } = await import("../../lib/cli-anything/registry.js");
    const { runCliAnythingPipeline } = await import("../../lib/cli-anything/pipeline.js");

    const apps = listRegisteredApps();
    const limit = args.limit || apps.length;
    const batch = apps.slice(0, limit);

    log(`    Apps: ${batch.length}/${apps.length} (limit: ${limit})`);

    const results: Array<{ app: string; commands: number; quality: number }> = [];
    const fails: string[] = [];

    for (const app of batch) {
      try {
        if (args.dryRun) {
          log(`    [dry-run] Would generate: ${app}`);
          results.push({ app, commands: 0, quality: 0 });
          continue;
        }
        const result = await runCliAnythingPipeline({
          appName: app,
          deep: args.deep,
          dryRun: false,
          force: args.force,
          json: false,
          ai: args.ai,
          tier: "free",
          outputDir: args.outputDir || "examples/generated-skills",
          orchestrate: false,
        });
        results.push({
          app,
          commands: result.design.commands.length,
          quality: result.quality.overall,
        });
        totals.commands += result.design.commands.length;
        log(`    ok ${app}: ${result.design.commands.length} cmds, quality ${result.quality.overall}/100`);
      } catch (err) {
        fails.push(app);
        log(`    FAIL ${app}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    totals.apps = results.length;
    totals.skills = results.length; // Each app generates a skill
    phases.push({
      phase: 1, name: "cli-anything-batch", status: fails.length > 0 ? "failed" : "ok",
      durationMs: Date.now() - p1Start,
      detail: { succeeded: results.length, failed: fails.length },
    });
  } catch (err) {
    phases.push({ phase: 1, name: "cli-anything-batch", status: "failed", durationMs: Date.now() - p1Start });
    log(`    ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }
  log("");

  // ── Phase 2: Build plugins ───────────────────────────────────────────

  const p2Start = Date.now();
  log("  Phase 2/6: Build domain plugins");
  try {
    const { pluginMode } = await import("./mode-plugin.js");
    const pluginArgs = { ...args, plugin: true };
    await pluginMode(pluginArgs, p2Start);

    // Count generated plugins
    const fs = await import("node:fs");
    const path = await import("node:path");
    const pluginsDir = path.resolve("plugins");
    if (fs.existsSync(pluginsDir)) {
      const dirs = fs.readdirSync(pluginsDir).filter(d =>
        fs.statSync(path.join(pluginsDir, d)).isDirectory()
      );
      totals.plugins = dirs.length;
    }

    phases.push({ phase: 2, name: "plugins", status: "ok", durationMs: Date.now() - p2Start, detail: { count: totals.plugins } });
  } catch (err) {
    phases.push({ phase: 2, name: "plugins", status: "failed", durationMs: Date.now() - p2Start });
    log(`    ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }
  log("");

  // ── Phase 3: Agent definitions ───────────────────────────────────────

  const p3Start = Date.now();
  log("  Phase 3/6: Generate agent definitions");
  try {
    const { agentDefsMode } = await import("./mode-plugin.js");
    const agentArgs = { ...args, agentDefs: true };
    await agentDefsMode(agentArgs, p3Start);

    // Count agent files
    const fs = await import("node:fs");
    const path = await import("node:path");
    const pluginsDir = path.resolve("plugins");
    if (fs.existsSync(pluginsDir)) {
      let agentCount = 0;
      for (const d of fs.readdirSync(pluginsDir)) {
        const agentsDir = path.join(pluginsDir, d, "agents");
        if (fs.existsSync(agentsDir)) {
          agentCount += fs.readdirSync(agentsDir).filter(f => f.endsWith(".md")).length;
        }
      }
      totals.agents = agentCount;
    }

    phases.push({ phase: 3, name: "agent-defs", status: "ok", durationMs: Date.now() - p3Start, detail: { count: totals.agents } });
  } catch (err) {
    phases.push({ phase: 3, name: "agent-defs", status: "failed", durationMs: Date.now() - p3Start });
    log(`    ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }
  log("");

  // ── Phase 4: Marketplace v2 bundle ───────────────────────────────────

  const p4Start = Date.now();
  log("  Phase 4/6: Marketplace v2 bundling");
  try {
    const { marketplaceV2Mode } = await import("./mode-marketplace-v2.js");
    const mpArgs = { ...args, marketplaceV2: true };
    await marketplaceV2Mode(mpArgs, p4Start);

    // Count marketplace products
    const fs = await import("node:fs");
    const path = await import("node:path");
    const mpDir = path.resolve(args.outputDir || "marketplace-v2");
    const catalogPath = path.join(mpDir, "marketplace.json");
    if (fs.existsSync(catalogPath)) {
      try {
        const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
        totals.marketplaceProducts = Array.isArray(catalog.entries) ? catalog.entries.length :
          Array.isArray(catalog) ? catalog.length : 0;
      } catch { /* ignore parse errors */ }
    }

    phases.push({ phase: 4, name: "marketplace-v2", status: "ok", durationMs: Date.now() - p4Start, detail: { products: totals.marketplaceProducts } });
  } catch (err) {
    phases.push({ phase: 4, name: "marketplace-v2", status: "failed", durationMs: Date.now() - p4Start });
    log(`    ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }
  log("");

  // ── Phase 5: Quality audit ───────────────────────────────────────────

  const p5Start = Date.now();
  log("  Phase 5/6: Quality audit");
  try {
    const { testAllSkillsSync } = await import("../../lib/skill-tester.js");
    const path = await import("node:path");
    const skillsDir = path.resolve(args.outputDir || "examples/generated-skills");
    const results = testAllSkillsSync(skillsDir, args.domain || undefined);
    totals.auditTotal = results.length;
    totals.auditPassed = results.filter(r => r.passed).length;
    log(`    Results: ${totals.auditPassed}/${totals.auditTotal} passed`);
    phases.push({ phase: 5, name: "audit", status: "ok", durationMs: Date.now() - p5Start, detail: { passed: totals.auditPassed, total: totals.auditTotal } });
  } catch (err) {
    phases.push({ phase: 5, name: "audit", status: "failed", durationMs: Date.now() - p5Start });
    log(`    ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }
  log("");

  // ── Phase 6: Summary ────────────────────────────────────────────────

  const totalDuration = Date.now() - startTime;
  phases.push({ phase: 6, name: "summary", status: "ok", durationMs: 0 });

  const summary: PipelineSummary = { phases, totals, durationMs: totalDuration };

  if (args.json) {
    emit(success("full-pipeline", summary, startTime), true);
  } else {
    log("  Phase 6/6: Pipeline Summary");
    log("  ════════════════════════════════════════");
    log(`    Apps generated:       ${totals.apps}`);
    log(`    Commands:             ${totals.commands}`);
    log(`    Skills:               ${totals.skills}`);
    log(`    Plugins:              ${totals.plugins}`);
    log(`    Agents:               ${totals.agents}`);
    log(`    Marketplace products: ${totals.marketplaceProducts}`);
    log(`    Quality audit:        ${totals.auditPassed}/${totals.auditTotal} passed`);
    log(`    Duration:             ${(totalDuration / 1000).toFixed(1)}s`);
    log("  ════════════════════════════════════════");
    log("");

    const failed = phases.filter(p => p.status === "failed");
    if (failed.length > 0) {
      log(`  WARNING: ${failed.length} phase(s) failed: ${failed.map(p => p.name).join(", ")}`);
    } else {
      log("  All phases completed successfully.");
    }
    log("");
  }
}
