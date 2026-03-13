/**
 * orchestration/runner.ts — Core execution engine for multi-app recipes.
 *
 * Processes apps with concurrency control, checkpoint writing,
 * quality retry, and resume support.
 */

import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { toErrorMessage } from "../output.js";
import { runCliAnythingPipeline } from "../cli-anything/pipeline.js";
import type { CliAnythingOpts } from "../cli-anything/types.js";
import type {
  Recipe,
  RecipeExecution,
  PipelineState,
  CheckpointEntry,
} from "./types.js";

// ── Options ────────────────────────────────────────────────────────────

export interface RunnerOpts {
  recipe: Recipe;
  outputDir: string;
  dryRun: boolean;
  concurrency: number;
  resume?: string;
  tier: string;
  onProgress?: (app: string, phase: number, status: string) => void;
}

// ── Semaphore ──────────────────────────────────────────────────────────

class Semaphore {
  private current = 0;
  private queue: Array<() => void> = [];

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.current--;
    const next = this.queue.shift();
    if (next) {
      this.current++;
      next();
    }
  }
}

// ── Checkpoint I/O ─────────────────────────────────────────────────────

function checkpointDir(outputDir: string, executionId: string, app: string): string {
  return join(outputDir, "orchestration", executionId, app);
}

function writeCheckpoint(outputDir: string, executionId: string, entry: CheckpointEntry): void {
  const dir = checkpointDir(outputDir, executionId, entry.app);
  mkdirSync(dir, { recursive: true });
  const line = JSON.stringify(entry) + "\n";
  const filePath = join(dir, "checkpoint.jsonl");
  writeFileSync(filePath, line, { flag: "a" });
}

function readCheckpoints(outputDir: string, executionId: string, app: string): CheckpointEntry[] {
  const filePath = join(checkpointDir(outputDir, executionId, app), "checkpoint.jsonl");
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
  const entries: CheckpointEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line) as CheckpointEntry);
    } catch {
      // skip malformed lines
    }
  }
  return entries;
}

function findResumeApps(outputDir: string, executionId: string): Set<string> {
  const orchDir = join(outputDir, "orchestration", executionId);
  if (!existsSync(orchDir)) return new Set();
  const completedApps = new Set<string>();
  try {
    const dirs = readdirSync(orchDir, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const checkpoints = readCheckpoints(outputDir, executionId, d.name);
      const lastCheckpoint = checkpoints[checkpoints.length - 1];
      if (lastCheckpoint && lastCheckpoint.data.status === "completed") {
        completedApps.add(d.name);
      }
    }
  } catch {
    // directory may not exist yet
  }
  return completedApps;
}

// ── Pipeline Runner ────────────────────────────────────────────────────

function createPipelineState(app: string): PipelineState {
  return {
    app,
    status: "queued",
    currentPhase: 0,
    phases: [],
    retryCount: 0,
    startedAt: new Date().toISOString(),
  };
}

async function runAppPipeline(
  app: string,
  opts: RunnerOpts,
  execution: RecipeExecution,
): Promise<void> {
  const state = execution.pipelines.get(app)!;
  state.status = "running";
  state.startedAt = new Date().toISOString();

  const pipelineOpts: CliAnythingOpts = {
    appName: app,
    deep: false,
    dryRun: opts.dryRun,
    force: false,
    json: false,
    ai: false,
    tier: opts.tier,
    outputDir: opts.outputDir,
    orchestrate: true,
    recipe: opts.recipe.id,
  };

  const runOnce = async (isRetry: boolean): Promise<boolean> => {
    if (isRetry) {
      pipelineOpts.force = true;
      state.retryCount++;
      state.status = "retrying";
    }

    try {
      const result = await runCliAnythingPipeline(pipelineOpts, (phase, name, status) => {
        state.currentPhase = phase;
        opts.onProgress?.(app, phase, status);

        if (status === "done") {
          state.phases.push({ phase, status: "completed" });
          writeCheckpoint(opts.outputDir, execution.executionId, {
            app,
            phase,
            timestamp: new Date().toISOString(),
            data: { status: "phase-done", name },
          });
        } else if (status === "error") {
          state.phases.push({ phase, status: "failed" });
        }
      });

      // Check quality gate
      if (result.quality.passed) {
        state.status = "completed";
        state.completedAt = new Date().toISOString();
        execution.metering.completedApps++;
        execution.metering.totalCommands += result.design.commands.length;
        execution.metering.totalTests += result.testPlan.totalCount;

        writeCheckpoint(opts.outputDir, execution.executionId, {
          app,
          phase: 7,
          timestamp: new Date().toISOString(),
          data: {
            status: "completed",
            quality: result.quality.overall,
            commands: result.design.commands.length,
            tests: result.testPlan.totalCount,
          },
        });
        return true;
      }

      // Quality gate failed
      return false;
    } catch (err) {
      const message = toErrorMessage(err);
      state.phases.push({
        phase: state.currentPhase,
        status: "failed",
        error: message,
      });

      writeCheckpoint(opts.outputDir, execution.executionId, {
        app,
        phase: state.currentPhase,
        timestamp: new Date().toISOString(),
        data: { status: "error", error: message },
      });
      return false;
    }
  };

  // First attempt
  const succeeded = await runOnce(false);
  if (succeeded) return;

  // Quality retry (one attempt with force flag)
  if (state.retryCount === 0) {
    const retrySucceeded = await runOnce(true);
    if (retrySucceeded) return;
  }

  // Final failure
  state.status = "failed";
  state.completedAt = new Date().toISOString();
  execution.metering.failedApps++;

  writeCheckpoint(opts.outputDir, execution.executionId, {
    app,
    phase: state.currentPhase,
    timestamp: new Date().toISOString(),
    data: { status: "failed", retryCount: state.retryCount },
  });
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Execute a recipe: process all apps with concurrency control,
 * checkpointing, quality retry, and resume support.
 */
export async function executeRecipe(opts: RunnerOpts): Promise<RecipeExecution> {
  const executionId = opts.resume || randomUUID();

  const execution: RecipeExecution = {
    recipeId: opts.recipe.id,
    executionId,
    pipelines: new Map(),
    status: "running",
    startedAt: new Date().toISOString(),
    metering: {
      totalApps: opts.recipe.apps.length,
      completedApps: 0,
      failedApps: 0,
      totalDurationMs: 0,
      totalCommands: 0,
      totalTests: 0,
    },
  };

  // Determine which apps to skip on resume
  const completedApps = opts.resume
    ? findResumeApps(opts.outputDir, executionId)
    : new Set<string>();

  const appsToRun = opts.recipe.apps.filter((a) => !completedApps.has(a));
  execution.metering.completedApps = completedApps.size;

  // Initialize pipeline states
  for (const app of opts.recipe.apps) {
    if (completedApps.has(app)) {
      const state = createPipelineState(app);
      state.status = "completed";
      state.completedAt = new Date().toISOString();
      execution.pipelines.set(app, state);
    } else {
      execution.pipelines.set(app, createPipelineState(app));
    }
  }

  // Process with concurrency control
  const concurrency = Math.min(opts.concurrency, opts.recipe.concurrency);
  const semaphore = new Semaphore(concurrency);

  const startMs = Date.now();

  const tasks = appsToRun.map(async (app) => {
    await semaphore.acquire();
    try {
      await runAppPipeline(app, opts, execution);
    } finally {
      semaphore.release();
    }
  });

  await Promise.all(tasks);

  execution.metering.totalDurationMs = Date.now() - startMs;
  execution.completedAt = new Date().toISOString();

  // Determine overall status
  const allCompleted = execution.metering.completedApps === execution.metering.totalApps;
  const anyFailed = execution.metering.failedApps > 0;
  execution.status = allCompleted ? "completed" : anyFailed ? "failed" : "completed";

  return execution;
}
