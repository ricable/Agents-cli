/**
 * Agentic composition loop: propose → validate → refine → re-validate.
 *
 * Main entry point for workflow generation. Runs 3-5 iterations to
 * converge on a quality workflow. Uses Ollama for drafting and
 * Claude for refinement.
 */

import { TieredLLMClient } from "./llm-client.js";
import { proposeWorkflow, refineWorkflow, type SkillProfile } from "./proposer.js";
import { validateWorkflow, type ValidationReport } from "./validator.js";
import { serializeWorkflowYaml, type WorkflowYAML } from "./schema.js";
import { generateRunScript, generateSetupScript, generateSkillMdFromWorkflow } from "./script-generator.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface ComposeOptions {
  /** Natural language workflow description */
  prompt: string;
  /** Pre-selected skill IDs */
  seedSkills?: string[];
  /** Available skills with profiles */
  availableSkills: SkillProfile[];
  /** Known skill IDs for validation */
  knownSkillIds: Set<string>;
  /** Maximum iterations (default: 5) */
  maxIterations?: number;
  /** Minimum quality score to accept (default: 0.8) */
  minQuality?: number;
  /** Creativity level (default: 0.5) */
  creativity?: number;
  /** Target domain */
  domain?: string;
  /** Use Docker sandbox for validation */
  sandbox?: boolean;
  /** LLM client configuration */
  llmConfig?: {
    ollamaUrl?: string;
    ollamaModel?: string;
    claudeApiKey?: string;
  };
  /** Progress callback */
  onProgress?: (iteration: number, report: ValidationReport) => void;
}

export interface ComposeResult {
  workflow: WorkflowYAML;
  workflowYaml: string;
  skillMd: string;
  runScript: string;
  setupScript: string;
  trace: IterationTrace[];
  finalQuality: number;
  iterations: number;
  converged: boolean;
}

export interface IterationTrace {
  iteration: number;
  action: "propose" | "refine";
  qualityBefore: number;
  qualityAfter: number;
  issuesBefore: string[];
  issuesAfter: string[];
  durationMs: number;
}

// ── Main composition loop ──────────────────────────────────────────────

/**
 * Compose a workflow through iterative LLM refinement.
 *
 * Loop:
 * 1. Propose (Ollama) → initial workflow
 * 2. Validate (static) → issues list
 * 3. Refine (Claude/Ollama) → fix issues
 * 4. Re-validate → check fixes
 * 5. Repeat until quality >= threshold or max iterations
 */
export async function composeWorkflow(opts: ComposeOptions): Promise<ComposeResult> {
  const client = new TieredLLMClient(opts.llmConfig);
  const maxIterations = opts.maxIterations ?? 5;
  const minQuality = opts.minQuality ?? 0.8;
  const trace: IterationTrace[] = [];

  // 1. Initial proposal
  const start = Date.now();
  const proposal = await proposeWorkflow(client, {
    prompt: opts.prompt,
    seedSkills: opts.seedSkills,
    availableSkills: opts.availableSkills,
    creativity: opts.creativity,
    domain: opts.domain,
  });

  let workflow = proposal.workflow;
  let report = validateWorkflow(workflow, { knownSkills: opts.knownSkillIds });

  trace.push({
    iteration: 1,
    action: "propose",
    qualityBefore: 0,
    qualityAfter: report.score,
    issuesBefore: [],
    issuesAfter: report.issues,
    durationMs: Date.now() - start,
  });

  opts.onProgress?.(1, report);

  // 2-N. Refinement loop
  let iteration = 2;
  while (iteration <= maxIterations && report.score < minQuality && report.issues.length > 0) {
    const iterStart = Date.now();
    const prevIssues = [...report.issues];
    const prevScore = report.score;

    const refined = await refineWorkflow(client, workflow, report.issues, opts.availableSkills);
    workflow = refined.workflow;
    report = validateWorkflow(workflow, { knownSkills: opts.knownSkillIds });

    trace.push({
      iteration,
      action: "refine",
      qualityBefore: prevScore,
      qualityAfter: report.score,
      issuesBefore: prevIssues,
      issuesAfter: report.issues,
      durationMs: Date.now() - iterStart,
    });

    opts.onProgress?.(iteration, report);

    // Stop if no progress (same or worse score)
    if (report.score <= prevScore && iteration > 2) break;

    iteration++;
  }

  // Generate output artifacts
  const workflowYaml = serializeWorkflowYaml(workflow);
  const runScript = generateRunScript(workflow);
  const setupScript = generateSetupScript(workflow);
  const skillMd = generateSkillMdFromWorkflow(workflow);

  return {
    workflow,
    workflowYaml,
    skillMd,
    runScript,
    setupScript,
    trace,
    finalQuality: report.score,
    iterations: trace.length,
    converged: report.score >= minQuality,
  };
}
