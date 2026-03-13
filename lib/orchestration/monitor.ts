/**
 * orchestration/monitor.ts — Progress tracking and health checks.
 *
 * Provides human-readable formatting and structured summaries
 * for recipe executions.
 */

import type { RecipeExecution, ExecutionSummary } from "./types.js";

/**
 * Format execution progress as a human-readable multi-line string.
 */
export function formatExecutionProgress(execution: RecipeExecution): string {
  const lines: string[] = [];

  lines.push(`  Recipe:    ${execution.recipeId}`);
  lines.push(`  Execution: ${execution.executionId}`);
  lines.push(`  Status:    ${execution.status}`);
  lines.push("");

  const { metering } = execution;
  const pct = metering.totalApps > 0
    ? Math.round(((metering.completedApps + metering.failedApps) / metering.totalApps) * 100)
    : 0;
  lines.push(`  Progress: ${metering.completedApps}/${metering.totalApps} completed (${pct}%)`);
  if (metering.failedApps > 0) {
    lines.push(`  Failed:   ${metering.failedApps}`);
  }
  lines.push("");

  lines.push("  Apps:");
  for (const [app, state] of execution.pipelines) {
    const icon = state.status === "completed" ? "[ok]"
      : state.status === "failed" ? "[FAIL]"
      : state.status === "running" ? "[..]"
      : state.status === "retrying" ? "[retry]"
      : "[--]";
    const phase = state.currentPhase > 0 ? ` phase ${state.currentPhase}/7` : "";
    const duration = state.completedAt
      ? ` ${Date.parse(state.completedAt) - Date.parse(state.startedAt)}ms`
      : "";
    lines.push(`    ${icon} ${app.padEnd(22)}${phase}${duration}`);
  }

  lines.push("");
  lines.push(`  Duration:  ${metering.totalDurationMs}ms`);
  lines.push(`  Commands:  ${metering.totalCommands}`);
  lines.push(`  Tests:     ${metering.totalTests}`);

  return lines.join("\n");
}

/**
 * Build a structured execution summary suitable for JSON output.
 */
export function getExecutionSummary(execution: RecipeExecution): ExecutionSummary {
  const apps: ExecutionSummary["apps"] = [];

  for (const [name, state] of execution.pipelines) {
    apps.push({
      name,
      status: state.status,
    });
  }

  const { metering } = execution;
  const total = metering.totalApps;
  const completed = metering.completedApps;

  return {
    recipeId: execution.recipeId,
    executionId: execution.executionId,
    status: execution.status,
    progress: {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    apps,
    duration: metering.totalDurationMs,
    metering,
  };
}
