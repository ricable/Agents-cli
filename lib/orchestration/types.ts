/**
 * orchestration/types.ts — Types for multi-app pipeline execution.
 *
 * Manages agent teams, recipes, and progress monitoring for orchestrating
 * CLI-Anything pipelines across multiple applications.
 */

// ── Agent Roles ────────────────────────────────────────────────────────

export type AgentRoleName =
  | "analyzer"
  | "designer"
  | "implementer"
  | "test-planner"
  | "test-writer"
  | "documenter"
  | "publisher";

export type RecipeStatus = "pending" | "running" | "completed" | "failed" | "paused";
export type PipelineStatus = "queued" | "running" | "completed" | "failed" | "retrying";

export interface AgentRole {
  name: AgentRoleName;
  phase: number;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  timeoutMs: number;
  retryable: boolean;
}

// ── Recipes ────────────────────────────────────────────────────────────

export interface Recipe {
  id: string;
  name: string;
  description: string;
  version: string;
  apps: string[];
  teamSize: number;
  quality: { minOverall: number; minPerAxis: number };
  phases: number[];
  thresholds: Record<string, number>;
  concurrency: number;
  marketplace?: { price: number; currency: string };
}

// ── Pipeline State ─────────────────────────────────────────────────────

export interface PhaseState {
  phase: number;
  status: string;
  durationMs?: number;
  error?: string;
}

export interface PipelineState {
  app: string;
  status: PipelineStatus;
  currentPhase: number;
  phases: PhaseState[];
  retryCount: number;
  startedAt: string;
  completedAt?: string;
}

// ── Recipe Execution ───────────────────────────────────────────────────

export interface RecipeExecution {
  recipeId: string;
  executionId: string;
  pipelines: Map<string, PipelineState>;
  status: RecipeStatus;
  startedAt: string;
  completedAt?: string;
  metering: MeteringRecord;
}

// ── Metering ───────────────────────────────────────────────────────────

export interface MeteringRecord {
  totalApps: number;
  completedApps: number;
  failedApps: number;
  totalDurationMs: number;
  totalCommands: number;
  totalTests: number;
}

// ── Checkpointing ──────────────────────────────────────────────────────

export interface CheckpointEntry {
  app: string;
  phase: number;
  timestamp: string;
  data: Record<string, unknown>;
}

// ── Execution Summary ──────────────────────────────────────────────────

export interface ExecutionSummary {
  recipeId: string;
  executionId: string;
  status: RecipeStatus;
  progress: { completed: number; total: number; percentage: number };
  apps: Array<{ name: string; status: string; quality?: number }>;
  duration: number;
  metering: MeteringRecord;
}
