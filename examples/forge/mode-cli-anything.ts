/**
 * forge/mode-cli-anything.ts — CLI-Anything mode dispatcher.
 *
 * Handles:
 *   --cli-anything <app>         Single app pipeline
 *   --cli-anything-batch         Batch all registered apps
 *   --refine                     Gap analysis on existing harness
 */

import type { CliArgs } from "./types.js";
import { log } from "./helpers.js";
import { success, failure, emit } from "../../lib/output.js";

/**
 * Run CLI-Anything mode.
 */
export async function cliAnythingMode(args: CliArgs, startTime: number): Promise<void> {
  const { runCliAnythingPipeline, formatPipelineResult } = await import(
    "../../lib/cli-anything/pipeline.js"
  );

  if (args.cliAnythingBatch) {
    await batchMode(args, startTime);
    return;
  }

  if (args.refine && args.cliAnything) {
    await refineMode(args, startTime);
    return;
  }

  // Single app pipeline
  const appName = args.cliAnything;
  if (!appName) {
    emit(failure("cli-anything", "MISSING_APP", "Specify an app name: --cli-anything <app>", startTime), args.json);
    return;
  }

  log(`  Mode: CLI-Anything Pipeline`);
  log(`  App:  ${appName}`);
  log("");

  try {
    const result = await runCliAnythingPipeline(
      {
        appName,
        deep: args.deep,
        dryRun: args.dryRun,
        force: args.force,
        json: args.json,
        ai: args.ai,
        tier: "free",
        outputDir: args.outputDir || "examples/generated-skills",
        orchestrate: false,
      },
      (phase, name, status) => {
        if (!args.json) {
          const icon = status === "start" ? ">>" : status === "done" ? "ok" : "!!";
          log(`  ${icon} Phase ${phase}: ${name}`);
        }
      },
    );

    if (args.json) {
      emit(success("cli-anything", {
        app: result.profile.name,
        installed: result.profile.installed,
        commands: result.design.commands.length,
        groups: result.design.groups.length,
        tests: result.testPlan.totalCount,
        quality: {
          overall: result.quality.overall,
          passed: result.quality.passed,
          axes: result.quality.axes.map(a => ({ axis: a.axis, score: a.score, passed: a.passed })),
        },
        outputDir: result.published.skillDir,
        phases: result.phases,
      }, startTime), true);
    } else {
      log("");
      log(formatPipelineResult(result));
      log("");
      if (result.quality.passed) {
        log("  All 6 quality axes passed.");
      } else {
        const failing = result.quality.axes.filter(a => !a.passed);
        log(`  ${failing.length} quality axes below threshold.`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit(failure("cli-anything", "PIPELINE_ERROR", message, startTime), args.json);
    if (!args.json) {
      console.error(`  Error: ${message}`);
    }
  }
}

/**
 * Batch mode: run pipeline for all registered apps.
 */
async function batchMode(args: CliArgs, startTime: number): Promise<void> {
  const { listRegisteredApps } = await import("../../lib/cli-anything/registry.js");
  const { runCliAnythingPipeline } = await import("../../lib/cli-anything/pipeline.js");

  const apps = listRegisteredApps();
  const limit = args.limit || apps.length;
  const batch = apps.slice(0, limit);

  log(`  Mode: CLI-Anything Batch (${batch.length}/${apps.length} apps)`);
  log("");

  const results: Array<{ app: string; commands: number; quality: number; passed: boolean }> = [];
  const failures: Array<{ app: string; error: string }> = [];

  for (const app of batch) {
    try {
      log(`  >> ${app}...`);
      const result = await runCliAnythingPipeline({
        appName: app,
        deep: args.deep,
        dryRun: args.dryRun,
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
        passed: result.quality.passed,
      });
      log(`     ok ${app}: ${result.design.commands.length} cmds, quality ${result.quality.overall}/100`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ app, error: message });
      log(`     FAIL ${app}: ${message}`);
    }
  }

  log("");
  log(`  Results: ${results.length} succeeded, ${failures.length} failed`);

  if (args.json) {
    emit(success("cli-anything-batch", { results, failures }, startTime), true);
  }
}

/**
 * Refine mode: gap analysis on existing harness.
 */
async function refineMode(args: CliArgs, startTime: number): Promise<void> {
  const { runCliAnythingPipeline } = await import("../../lib/cli-anything/pipeline.js");
  const { analyzeGaps, formatGapAnalysis } = await import("../../lib/cli-anything/refine.js");

  const appName = args.cliAnything;
  if (!appName) {
    emit(failure("cli-anything-refine", "MISSING_APP", "Specify an app: --cli-anything <app> --refine", startTime), args.json);
    return;
  }

  log(`  Mode: CLI-Anything Refine`);
  log(`  App:  ${appName}`);
  log("");

  try {
    // Run pipeline to get current state
    const result = await runCliAnythingPipeline({
      appName,
      deep: args.deep,
      dryRun: true, // Don't write anything
      force: false,
      json: false,
      ai: args.ai,
      tier: "free",
      outputDir: args.outputDir || "examples/generated-skills",
      orchestrate: false,
    });

    // Analyze gaps
    const gaps = analyzeGaps({
      profile: result.profile,
      design: result.design,
      testPlan: result.testPlan,
      docs: result.docs,
    });

    if (args.json) {
      emit(success("cli-anything-refine", gaps, startTime), true);
    } else {
      log("  Gap Analysis:");
      log(formatGapAnalysis(gaps));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit(failure("cli-anything-refine", "REFINE_ERROR", message, startTime), args.json);
  }
}
