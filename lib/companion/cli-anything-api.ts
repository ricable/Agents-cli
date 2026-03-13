/**
 * companion/cli-anything-api.ts — Route handlers for CLI-Anything endpoints.
 *
 * Wired into web-service.ts to expose /api/cli-anything/* routes.
 * Respects tier limits: free=3/day structural, pro=50/day AI.
 */

import { randomUUID } from "node:crypto";
import { toErrorMessage } from "../output.js";
import { getTierLimits } from "./tiers.js";
import type { IncomingMessage } from "node:http";
import type { CliAnythingResult } from "../cli-anything/types.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

interface GenerateJobState {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  tier: string;
  appName: string;
  progress: number;
  result?: CliAnythingResult;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// ── In-memory job store ────────────────────────────────────────────────

const activeJobs = new Map<string, GenerateJobState>();
let runningCount = 0;
const MAX_CONCURRENT = 3;
const JOB_TTL_MS = 3_600_000; // 1 hour

// Sweep expired jobs periodically
const sweepTimer = setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of activeJobs) {
    if (job.updatedAt < cutoff && (job.status === "completed" || job.status === "failed")) {
      activeJobs.delete(id);
    }
  }
}, 60_000);
sweepTimer.unref();

// ── Tier-based limits ──────────────────────────────────────────────────

const TIER_DAILY_CLI_ANYTHING: Record<string, number> = {
  free: 3,
  starter: 15,
  pro: 50,
  enterprise: -1, // unlimited
};

function getDailyLimit(tier: string): number {
  return TIER_DAILY_CLI_ANYTHING[tier] ?? TIER_DAILY_CLI_ANYTHING["free"]!;
}

function canUseAi(tier: string): boolean {
  const limits = getTierLimits(tier);
  return limits.ai;
}

// ── Validators ─────────────────────────────────────────────────────────

function validateAppName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 200) return null;
  // Reject control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return null;
  return trimmed;
}

function validateBody(body: unknown): { appName: string; deep?: boolean; dryRun?: boolean; outputDir?: string } | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  const appName = validateAppName(obj["appName"]);
  if (!appName) return null;
  return {
    appName,
    deep: typeof obj["deep"] === "boolean" ? obj["deep"] : undefined,
    dryRun: typeof obj["dryRun"] === "boolean" ? obj["dryRun"] : undefined,
    outputDir: typeof obj["outputDir"] === "string" ? obj["outputDir"] : undefined,
  };
}

// ── Job execution ──────────────────────────────────────────────────────

async function executeGenerateJob(job: GenerateJobState): Promise<void> {
  try {
    job.status = "running";
    job.progress = 10;
    job.updatedAt = Date.now();

    // Lazy import to avoid loading cli-anything at module init
    const { runCliAnythingPipeline } = await import("../cli-anything/pipeline.js");

    const useAi = canUseAi(job.tier);

    const result = await runCliAnythingPipeline(
      {
        appName: job.appName,
        deep: false,
        dryRun: false,
        force: false,
        json: true,
        ai: useAi,
        tier: job.tier,
        outputDir: "examples/generated-skills",
        orchestrate: false,
      },
      (_phase, _name, status) => {
        if (status === "start") {
          job.progress = Math.min(10 + _phase * 12, 90);
          job.updatedAt = Date.now();
        }
      },
    );

    job.result = result;
    job.status = "completed";
    job.progress = 100;
    job.updatedAt = Date.now();
  } catch (err) {
    job.status = "failed";
    job.error = toErrorMessage(err);
    job.updatedAt = Date.now();
  } finally {
    runningCount = Math.max(0, runningCount - 1);
  }
}

// ── Route Handlers ─────────────────────────────────────────────────────

/**
 * POST /api/cli-anything/generate
 * Enqueue a CLI-Anything generation job.
 */
export async function handleGenerate(
  _req: IncomingMessage,
  body: unknown,
  tier: string,
): Promise<ApiResponse> {
  const parsed = validateBody(body);
  if (!parsed) {
    return {
      status: 400,
      body: { ok: false, error: { code: "INVALID_INPUT", message: "Missing or invalid 'appName' field" } },
    };
  }

  const dailyLimit = getDailyLimit(tier);
  // Note: daily limit tracking is handled by the caller (web-service.ts) via UsageMeter.
  // This check is a safety net for the per-endpoint limit.
  if (dailyLimit === 0) {
    return {
      status: 403,
      body: { ok: false, error: { code: "TIER_REQUIRED", message: "CLI-Anything generation not available on this tier" } },
    };
  }

  if (runningCount >= MAX_CONCURRENT) {
    return {
      status: 503,
      body: { ok: false, error: { code: "BUSY", message: "Too many concurrent jobs — try again shortly" } },
    };
  }

  const job: GenerateJobState = {
    id: randomUUID(),
    status: "queued",
    tier,
    appName: parsed.appName,
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  activeJobs.set(job.id, job);
  runningCount++;

  // Fire and forget — caller polls /status
  executeGenerateJob(job).catch(() => {
    // Error already captured in job state
  });

  return {
    status: 202,
    body: { ok: true, data: { jobId: job.id, status: "queued", appName: parsed.appName } },
  };
}

/**
 * POST /api/cli-anything/refine
 * Run refinement on an existing harness (requires pro tier).
 */
export async function handleRefine(
  _req: IncomingMessage,
  body: unknown,
  tier: string,
): Promise<ApiResponse> {
  if (!canUseAi(tier)) {
    return {
      status: 403,
      body: { ok: false, error: { code: "TIER_REQUIRED", message: "Refinement requires pro tier or above (AI access)" } },
    };
  }

  const parsed = validateBody(body);
  if (!parsed) {
    return {
      status: 400,
      body: { ok: false, error: { code: "INVALID_INPUT", message: "Missing or invalid 'appName' field" } },
    };
  }

  try {
    // Lazy import
    const { runCliAnythingPipeline } = await import("../cli-anything/pipeline.js");

    const result = await runCliAnythingPipeline(
      {
        appName: parsed.appName,
        deep: true,
        dryRun: parsed.dryRun ?? false,
        force: true,
        json: true,
        ai: true,
        tier,
        outputDir: parsed.outputDir ?? "examples/generated-skills",
        orchestrate: false,
        refine: true,
      },
    );

    return {
      status: 200,
      body: {
        ok: true,
        data: {
          appName: result.profile.name,
          displayName: result.profile.displayName,
          commands: result.design.commands.length,
          tests: result.testPlan.totalCount,
          quality: {
            overall: result.quality.overall,
            passed: result.quality.passed,
            axes: result.quality.axes.map(a => ({
              axis: a.axis,
              score: a.score,
              passed: a.passed,
            })),
          },
          output: result.published.skillDir,
          phases: result.phases.map(p => ({
            name: p.name,
            durationMs: p.durationMs,
            success: p.success,
          })),
        },
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: { ok: false, error: { code: "REFINE_ERROR", message: toErrorMessage(err) } },
    };
  }
}

/**
 * GET /api/cli-anything/status/:jobId
 * Check the status of a generate job.
 */
export async function handleGenerateStatus(jobId: string): Promise<ApiResponse> {
  // Validate jobId format (UUID)
  if (!/^[a-f0-9-]{36}$/.test(jobId)) {
    return {
      status: 400,
      body: { ok: false, error: { code: "INVALID_ID", message: "Invalid job ID format" } },
    };
  }

  const job = activeJobs.get(jobId);
  if (!job) {
    return {
      status: 404,
      body: { ok: false, error: { code: "NOT_FOUND", message: "Job not found or expired" } },
    };
  }

  const data: Record<string, unknown> = {
    id: job.id,
    status: job.status,
    appName: job.appName,
    progress: job.progress,
    createdAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date(job.updatedAt).toISOString(),
  };

  if (job.error) {
    data["error"] = job.error;
  }

  if (job.result) {
    data["result"] = {
      appName: job.result.profile.name,
      displayName: job.result.profile.displayName,
      commands: job.result.design.commands.length,
      tests: job.result.testPlan.totalCount,
      quality: {
        overall: job.result.quality.overall,
        passed: job.result.quality.passed,
      },
      output: job.result.published.skillDir,
    };
  }

  return { status: 200, body: { ok: true, data } };
}
