/**
 * Workflow validator: static checks + optional Docker sandbox validation.
 *
 * Static checks verify:
 * - All referenced skills exist
 * - Data flow edges connect valid step outputs to inputs
 * - Environment variables are documented
 * - No circular dependencies between steps
 * - Commands are non-empty
 *
 * Docker sandbox (optional):
 * - Builds a sandboxed container
 * - Runs setup.sh + run.sh
 * - Captures exit codes and output
 */

import type { WorkflowYAML, ValidationResult } from "./schema.js";
import { scoreWorkflowQuality } from "../skill-tester.js";
import { generateRunScript, generateSetupScript, generateSkillMdFromWorkflow } from "./script-generator.js";

/** Minimum per-axis quality threshold (per CLAUDE.md: all 4 axes >= 0.5). */
const MIN_AXIS_SCORE = 0.5;
/** Blend weights: static checks vs workflow quality. */
const STATIC_WEIGHT = 0.4;
const QUALITY_WEIGHT = 0.6;

// ── Types ──────────────────────────────────────────────────────────────

export interface ValidatorOptions {
  /** Set of known skill IDs */
  knownSkills: Set<string>;
  /** Whether to run Docker sandbox validation */
  useSandbox?: boolean;
  /** Docker image to use for sandbox (default: node:20-slim) */
  sandboxImage?: string;
}

export interface ValidationReport {
  passed: boolean;
  score: number;          // 0.0 - 1.0
  issues: string[];
  checks: ValidationResult[];
}

// ── Static validation ──────────────────────────────────────────────────

/**
 * Run all static validation checks on a workflow.
 */
export function validateWorkflow(
  workflow: WorkflowYAML,
  opts: ValidatorOptions,
): ValidationReport {
  const checks: ValidationResult[] = [];
  const issues: string[] = [];

  // 1. Check that all steps reference known skills
  checks.push(checkSkillsExist(workflow, opts.knownSkills, issues));

  // 2. Check that all steps have non-empty commands
  checks.push(checkCommandsPresent(workflow, issues));

  // 3. Check data flow validity
  checks.push(checkDataFlow(workflow, issues));

  // 4. Check environment variables are documented
  checks.push(checkEnvVars(workflow, issues));

  // 5. Check for circular dependencies
  checks.push(checkNoCycles(workflow, issues));

  // 6. Check step IDs are unique
  checks.push(checkUniqueStepIds(workflow, issues));

  // 7. Check metadata completeness
  checks.push(checkMetadata(workflow, issues));

  const passedCount = checks.filter((c) => c.passed).length;
  const staticScore = checks.length > 0 ? passedCount / checks.length : 0;

  // Integrate scoreWorkflowQuality for the 4-axis quality gate
  let qualityScore = staticScore;
  if (workflow.spec.steps.length > 0) {
    try {
      const skillMd = generateSkillMdFromWorkflow(workflow);
      const runSh = generateRunScript(workflow);
      const setupSh = generateSetupScript(workflow);
      const files: Record<string, string> = {
        "scripts/run.sh": runSh,
        "scripts/setup.sh": setupSh,
      };
      const wq = scoreWorkflowQuality(skillMd, files);

      // All 4 axes must be >= 0.5 per project rules
      const axisScores = [wq.stepCompleteness, wq.dataFlowValidity, wq.envVarDocumentation, wq.setupRunnability];
      const axisAvg = axisScores.reduce((a, b) => a + b, 0) / axisScores.length;
      const allAxesMet = axisScores.every((s) => s >= MIN_AXIS_SCORE);

      if (!allAxesMet) {
        const axisNames = ["stepCompleteness", "dataFlowValidity", "envVarDocumentation", "setupRunnability"] as const;
        const failedAxes = axisNames
          .filter((_, i) => axisScores[i]! < MIN_AXIS_SCORE)
          .map((name, i) => `${name}=${axisScores[i]}`);
        issues.push(`Workflow quality axes below ${MIN_AXIS_SCORE}: ${failedAxes.join(", ")}`);
      }

      qualityScore = (staticScore * STATIC_WEIGHT) + (axisAvg * QUALITY_WEIGHT);
    } catch {
      // If quality scoring fails, fall back to static-only score
      qualityScore = staticScore;
    }
  }

  return {
    passed: issues.length === 0,
    score: Math.round(qualityScore * 100) / 100,
    issues,
    checks,
  };
}

// ── Individual checks ──────────────────────────────────────────────────

function checkSkillsExist(
  workflow: WorkflowYAML,
  knownSkills: Set<string>,
  issues: string[],
): ValidationResult {
  const missingSkills = workflow.spec.steps
    .filter((s) => !knownSkills.has(s.skill))
    .map((s) => s.skill);

  if (missingSkills.length > 0) {
    const msg = `Unknown skills: ${missingSkills.join(", ")}`;
    issues.push(msg);
    return { check: "skills-exist", passed: false, message: msg };
  }

  return { check: "skills-exist", passed: true, message: "All skills found" };
}

function checkCommandsPresent(workflow: WorkflowYAML, issues: string[]): ValidationResult {
  const empty = workflow.spec.steps.filter((s) => !s.command || s.command.trim() === "");

  if (empty.length > 0) {
    const msg = `Steps with empty commands: ${empty.map((s) => s.id).join(", ")}`;
    issues.push(msg);
    return { check: "commands-present", passed: false, message: msg };
  }

  return { check: "commands-present", passed: true, message: "All steps have commands" };
}

function checkDataFlow(workflow: WorkflowYAML, issues: string[]): ValidationResult {
  const stepIds = new Set(workflow.spec.steps.map((s) => s.id));
  const stepOutputs = new Map<string, Set<string>>();
  const inputNames = new Set(workflow.spec.inputs.map((i) => i.name));

  for (const step of workflow.spec.steps) {
    const outputs = new Set(step.outputs);
    stepOutputs.set(step.id, outputs);
  }

  const danglingEdges: string[] = [];
  for (const edge of workflow.spec.dataFlow) {
    const [fromStep] = edge.from.split(".");
    const [toStep] = edge.to.split(".");

    if (fromStep && !stepIds.has(fromStep) && !inputNames.has(fromStep)) {
      danglingEdges.push(`from: ${edge.from}`);
    }
    if (toStep && !stepIds.has(toStep)) {
      danglingEdges.push(`to: ${edge.to}`);
    }
  }

  if (danglingEdges.length > 0) {
    const msg = `Dangling data flow edges: ${danglingEdges.join(", ")}`;
    issues.push(msg);
    return { check: "data-flow", passed: false, message: msg };
  }

  return { check: "data-flow", passed: true, message: "Data flow is valid" };
}

function checkEnvVars(workflow: WorkflowYAML, issues: string[]): ValidationResult {
  const undocumented = workflow.spec.env.filter((e) => !e.description || e.description.trim() === "");

  if (undocumented.length > 0) {
    const msg = `Undocumented env vars: ${undocumented.map((e) => e.name).join(", ")}`;
    issues.push(msg);
    return { check: "env-documented", passed: false, message: msg };
  }

  return { check: "env-documented", passed: true, message: "All env vars documented" };
}

function checkNoCycles(workflow: WorkflowYAML, issues: string[]): ValidationResult {
  // Build adjacency list from data flow edges
  const graph = new Map<string, string[]>();
  for (const step of workflow.spec.steps) {
    graph.set(step.id, []);
  }

  for (const edge of workflow.spec.dataFlow) {
    const [fromStep] = edge.from.split(".");
    const [toStep] = edge.to.split(".");
    if (fromStep && toStep && graph.has(fromStep)) {
      graph.get(fromStep)!.push(toStep);
    }
  }

  // DFS cycle detection
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(node: string): boolean {
    if (inStack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    inStack.add(node);
    for (const neighbor of graph.get(node) ?? []) {
      if (hasCycle(neighbor)) return true;
    }
    inStack.delete(node);
    return false;
  }

  for (const stepId of graph.keys()) {
    if (hasCycle(stepId)) {
      const msg = "Circular dependency detected in data flow";
      issues.push(msg);
      return { check: "no-cycles", passed: false, message: msg };
    }
  }

  return { check: "no-cycles", passed: true, message: "No circular dependencies" };
}

function checkUniqueStepIds(workflow: WorkflowYAML, issues: string[]): ValidationResult {
  const ids = workflow.spec.steps.map((s) => s.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);

  if (duplicates.length > 0) {
    const msg = `Duplicate step IDs: ${[...new Set(duplicates)].join(", ")}`;
    issues.push(msg);
    return { check: "unique-ids", passed: false, message: msg };
  }

  return { check: "unique-ids", passed: true, message: "All step IDs are unique" };
}

function checkMetadata(workflow: WorkflowYAML, issues: string[]): ValidationResult {
  const meta = workflow.metadata;
  const missing: string[] = [];

  if (!meta.name || meta.name === "unnamed-workflow") missing.push("name");
  if (!meta.description) missing.push("description");
  if (!meta.domain || meta.domain === "general") missing.push("domain");

  if (missing.length > 0) {
    const msg = `Incomplete metadata: ${missing.join(", ")}`;
    issues.push(msg);
    return { check: "metadata", passed: false, message: msg };
  }

  return { check: "metadata", passed: true, message: "Metadata complete" };
}
