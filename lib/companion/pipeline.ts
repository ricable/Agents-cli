/**
 * companion/pipeline.ts — Reusable pipeline orchestrator for SaaS.
 *
 * Extracts the full pipeline logic from mode-companion.ts into a function
 * that can be called from the web service or CLI.
 *
 * 10-stage flow:
 *   Analyze → Map → Filter → Resolve+Install+Analyze → Skill Gen →
 *   Quality Gate → Workflow Composition → Plugin Build → Bundle → Report
 */

import { resolve } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { analyzeProject } from "./analyzer.js";
import { mapToTools } from "./mapper.js";
import { getTierLimits } from "./tiers.js";
import { composeWorkflows } from "../pipeline/workflow-composer.js";
import { generateWorkflowSkillDirectory } from "../pipeline/workflow-skill-gen.js";
import type { TechStackProfile } from "./analyzer.js";
import type { CompanionToolPlan, ToolRecommendation } from "./mapper.js";
import type { PipelineReport, StepQuality } from "../types.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface PipelineOpts {
  tier: string;
  deep?: boolean;
  full?: boolean;
  force?: boolean;
  noCache?: boolean;
  timeout?: number;
  concurrency?: number;
  projectRoot?: string;
  outputDir?: string;
  pluginsDir?: string;
}

export interface PipelineResult {
  profile: TechStackProfile;
  plan: CompanionToolPlan;
  generated: number;
  failures: number;
  failedTools: string[];
  workflows: string[];
  pluginDir?: string;
  bundlePath?: string;
  report: PipelineReport;
}

type ProgressCallback = (stage: string, pct: number) => void;

// ── Pipeline ───────────────────────────────────────────────────────────

/**
 * Execute the full companion pipeline:
 * description → analyze → map → filter → process → quality → workflows → plugin → bundle → report
 */
export async function executePipeline(
  description: string,
  opts: PipelineOpts,
  onProgress?: ProgressCallback,
): Promise<PipelineResult> {
  const tierLimits = getTierLimits(opts.tier);
  const projectRoot = opts.projectRoot ?? resolve(".");
  const steps: StepQuality[] = [];

  // Stage 1: Analyze (0-10%)
  onProgress?.("analyze", 0);
  const analyzeStart = Date.now();
  const profile = analyzeProject(description);
  steps.push({
    step: "analyze",
    score: profile.techs.length > 0 ? 1.0 : 0.3,
    issues: profile.techs.length === 0 ? ["No technologies detected"] : [],
    durationMs: Date.now() - analyzeStart,
  });
  onProgress?.("analyze", 10);

  // Stage 2: Map (10-20%)
  onProgress?.("map", 10);
  const mapStart = Date.now();
  const plan = mapToTools(profile, projectRoot);
  const mapScore = plan.recommendations.length > 0 ? 1.0 : 0.3;
  steps.push({
    step: "map",
    score: mapScore,
    issues: plan.recommendations.length === 0 ? ["No tools recommended"] : [],
    durationMs: Date.now() - mapStart,
  });
  onProgress?.("map", 20);

  // Stage 3: Filter (20-25%)
  onProgress?.("filter", 20);
  const filtered = filterByTier(plan.recommendations, tierLimits.maxTools);
  onProgress?.("filter", 25);

  // Stage 4-6: Resolve+Install+Analyze+SkillGen+Quality (25-70%)
  onProgress?.("process", 25);
  let generated = 0;
  let failures = 0;
  const failedTools: string[] = [];
  const skillMds: Array<{ name: string; skillMd: string }> = [];

  // Lazy import to avoid circular deps
  const { processBatch, buildIndexes } = await import("../../examples/forge/stages.js");
  const { OUTPUT_DIR } = await import("../../examples/forge/types.js");
  const { atomicWrite } = await import("../../examples/forge/helpers.js");

  const outputDir = opts.outputDir ?? OUTPUT_DIR;
  mkdirSync(outputDir, { recursive: true });

  const items = filtered.map(rec => ({
    label: rec.name,
    source: rec.source,
    curatedMeta: rec.category
      ? { description: rec.reason, agentValue: rec.reason, category: rec.category }
      : undefined,
  }));

  if (items.length > 0) {
    const processStart = Date.now();
    const outcome = await processBatch(items, {
      deep: opts.deep ?? tierLimits.deep,
      noCache: opts.noCache,
      force: opts.force,
      timeout: opts.timeout,
      concurrency: opts.concurrency,
      onProgress: (_label, completed, total) => {
        const pct = 25 + Math.round((completed / total) * 45);
        onProgress?.("process", pct);
      },
    });

    generated = outcome.results.length;
    failures = outcome.failures.length;
    for (const f of outcome.failures) failedTools.push(f.label);

    // Collect skill MDs for workflow composition
    for (const r of outcome.results) {
      if (r.forged.skillMd) {
        skillMds.push({ name: r.tool.meta.name, skillMd: r.forged.skillMd });
      }
    }

    const processScore = generated > 0 ? Math.min(1, generated / items.length) : 0;
    steps.push({
      step: "process",
      score: processScore,
      issues: failedTools.map(t => `Failed: ${t}`),
      durationMs: Date.now() - processStart,
    });

    // Build indexes
    if (outcome.results.length > 0) {
      const tools = outcome.results.map(r => r.tool);
      await buildIndexes(tools, false);
    }
  }

  onProgress?.("quality", 70);

  // Stage 7: Workflow Composition (70-75%)
  onProgress?.("workflow", 70);
  const workflows: string[] = [];
  if (tierLimits.workflows && skillMds.length > 0) {
    const workflowStart = Date.now();
    const composed = composeWorkflows(skillMds, profile);

    for (const wf of composed) {
      workflows.push(wf.name);
      // Write workflow skill directory
      const wfDir = resolve(outputDir, `src-workflow-${wf.name}`);
      mkdirSync(wfDir, { recursive: true });
      const dir = generateWorkflowSkillDirectory(wf);
      atomicWrite(resolve(wfDir, "SKILL.md"), dir.skillMd);
      for (const [relPath, content] of Object.entries(dir.files)) {
        const fullPath = resolve(wfDir, relPath);
        mkdirSync(resolve(wfDir, relPath.split("/").slice(0, -1).join("/")), { recursive: true });
        atomicWrite(fullPath, content);
      }
    }

    steps.push({
      step: "workflow",
      score: composed.length > 0 ? 1.0 : 0.5,
      issues: composed.length === 0 ? ["No workflows composed from skills"] : [],
      durationMs: Date.now() - workflowStart,
    });
  }
  onProgress?.("workflow", 75);

  // Stage 8: Plugin Build (75-85%)
  onProgress?.("plugin", 75);
  let pluginDir: string | undefined;

  if (generated > 0) {
    const { buildPlugins } = await import("../plugin/builder.js");
    const pluginsDir = opts.pluginsDir ?? resolve("examples/plugins");
    mkdirSync(pluginsDir, { recursive: true });

    try {
      // Generate skills-manifest from processed tools
      const manifestPath = resolve("skills-manifest.json");
      // Read existing manifest if available, otherwise skip plugin build
      if (existsSync(manifestPath)) {
        await buildPlugins({
          full: opts.full ?? tierLimits.full,
          manifestPath,
          skillsSourceDir: outputDir,
          pluginsDir,
        });
        pluginDir = resolve(pluginsDir, "companion");
      }
    } catch {
      // Plugin build is non-fatal
    }
  }
  onProgress?.("plugin", 85);

  // Stage 9: Bundle (85-95%)
  onProgress?.("bundle", 85);
  let bundlePath: string | undefined;
  if (pluginDir && existsSync(pluginDir)) {
    try {
      const { execSync } = await import("node:child_process");
      bundlePath = resolve(pluginDir, "..", "companion-bundle.tar.gz");
      execSync(`tar -czf "${bundlePath}" -C "${resolve(pluginDir, "..")}" companion`, {
        timeout: 30_000,
      });
    } catch {
      // Bundle is non-fatal
    }
  }
  onProgress?.("bundle", 95);

  // Stage 10: Report (95-100%)
  const aggregate = steps.length > 0
    ? steps.reduce((sum, s) => sum + s.score, 0) / steps.length
    : 0;
  const failedStep = steps.find(s => s.score < 0.3);

  const report: PipelineReport = {
    tool: description.slice(0, 100),
    source: "companion",
    steps,
    aggregate: Math.round(aggregate * 100) / 100,
    passed: !failedStep && generated > 0,
    failedAt: failedStep?.step,
    workflows,
  };

  onProgress?.("complete", 100);

  return {
    profile,
    plan,
    generated,
    failures,
    failedTools,
    workflows,
    pluginDir,
    bundlePath,
    report,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

function filterByTier(
  recs: readonly ToolRecommendation[],
  maxTools: number,
): ToolRecommendation[] {
  const result: ToolRecommendation[] = [];

  // Essential tools always included
  for (const rec of recs) {
    if (rec.priority === "essential") result.push(rec);
  }

  // Then recommended up to limit
  for (const rec of recs) {
    if (result.length >= maxTools) break;
    if (rec.priority === "recommended" && !result.includes(rec)) {
      result.push(rec);
    }
  }

  return result.slice(0, maxTools);
}
