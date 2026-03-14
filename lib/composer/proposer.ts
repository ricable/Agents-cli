/**
 * Workflow proposer: generates workflow.yaml from natural language prompts.
 *
 * Uses the tiered LLM client to propose workflows, leveraging discovered
 * skills and their IO profiles. Completely replaces the 7 hardcoded
 * WORKFLOW_RULES from workflow-composer.ts.
 */

import type { TieredLLMClient, LLMResponse } from "./llm-client.js";
import {
  type WorkflowYAML,
  type WorkflowStepSpec,
  type DataFlowEdge,
  type WorkflowEnvVar,
  createBlankWorkflow,
} from "./schema.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface ProposerInput {
  /** Natural language description of the desired workflow */
  prompt: string;
  /** Pre-selected skill IDs to include (optional) */
  seedSkills?: string[];
  /** Available skills with their descriptions and IO profiles */
  availableSkills: SkillProfile[];
  /** Creativity level: 0.0 (conservative) to 1.0 (creative cross-domain) */
  creativity?: number;
  /** Target domain (optional, for focused proposals) */
  domain?: string;
}

export interface SkillProfile {
  id: string;
  name: string;
  domain: string;
  description: string;
  commands: Array<{ name: string; description: string }>;
  inputs: string[];
  outputs: string[];
}

export interface ProposerResult {
  workflow: WorkflowYAML;
  reasoning: string;
  skillsUsed: string[];
  llmResponse: LLMResponse;
}

// ── Proposer ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a workflow composition expert for the agents-cli ecosystem.
Your job is to design executable workflows that chain CLI tools together.

Rules:
1. Each step must use a real skill from the provided list
2. Data flows between steps through files, stdout, or environment variables
3. Steps execute sequentially unless conditions are specified
4. Every step needs a concrete command — no placeholders
5. Environment variables must be documented with descriptions
6. Error handling strategy must be specified per step

Output format: JSON matching the WorkflowYAML schema.
Only output valid JSON, no markdown code fences or explanation.`;

/**
 * Generate a workflow proposal from a natural language prompt.
 */
export async function proposeWorkflow(
  client: TieredLLMClient,
  input: ProposerInput,
): Promise<ProposerResult> {
  const prompt = buildPrompt(input);
  const response = await client.generate("propose", prompt, SYSTEM_PROMPT);

  // Parse the LLM response into a WorkflowYAML
  const workflow = parseResponse(response.content, input);

  return {
    workflow,
    reasoning: extractReasoning(response.content),
    skillsUsed: workflow.spec.steps.map((s) => s.skill),
    llmResponse: response,
  };
}

/**
 * Refine an existing workflow based on validation feedback.
 */
export async function refineWorkflow(
  client: TieredLLMClient,
  workflow: WorkflowYAML,
  issues: string[],
  availableSkills: SkillProfile[],
): Promise<ProposerResult> {
  const prompt = buildRefinePrompt(workflow, issues, availableSkills);
  const response = await client.generate("refine", prompt, SYSTEM_PROMPT);
  const refined = parseResponse(response.content, { prompt: "", availableSkills });

  return {
    workflow: refined,
    reasoning: extractReasoning(response.content),
    skillsUsed: refined.spec.steps.map((s) => s.skill),
    llmResponse: response,
  };
}

// ── Prompt building ────────────────────────────────────────────────────

function buildPrompt(input: ProposerInput): string {
  const lines: string[] = [];

  lines.push(`Design a workflow for: "${input.prompt}"`);
  lines.push("");

  if (input.domain) {
    lines.push(`Target domain: ${input.domain}`);
  }

  if (input.creativity !== undefined) {
    lines.push(`Creativity level: ${input.creativity} (0=conservative, 1=creative cross-domain)`);
  }

  if (input.seedSkills && input.seedSkills.length > 0) {
    lines.push(`Must include these skills: ${input.seedSkills.join(", ")}`);
  }

  lines.push("");
  lines.push("Available skills:");
  lines.push("");

  // Include up to 50 skill profiles (context window discipline)
  const skills = input.availableSkills.slice(0, 50);
  for (const skill of skills) {
    lines.push(`- ${skill.id}: ${skill.description}`);
    if (skill.commands.length > 0) {
      lines.push(`  Commands: ${skill.commands.map((c) => c.name).join(", ")}`);
    }
    if (skill.inputs.length > 0) {
      lines.push(`  Inputs: ${skill.inputs.join(", ")}`);
    }
    if (skill.outputs.length > 0) {
      lines.push(`  Outputs: ${skill.outputs.join(", ")}`);
    }
  }

  lines.push("");
  lines.push("Generate a complete workflow.yaml as JSON. Include:");
  lines.push("- metadata (name, description, domain, version, tags)");
  lines.push("- spec.inputs and spec.outputs");
  lines.push("- spec.env (required environment variables)");
  lines.push("- spec.steps (ordered, with commands, args, inputs, outputs)");
  lines.push("- spec.dataFlow (edges connecting step outputs to step inputs)");
  lines.push("- spec.errorHandling");

  return lines.join("\n");
}

function buildRefinePrompt(
  workflow: WorkflowYAML,
  issues: string[],
  availableSkills: SkillProfile[],
): string {
  const lines: string[] = [];

  lines.push("Refine this workflow to fix the following issues:");
  lines.push("");
  for (const issue of issues) {
    lines.push(`- ${issue}`);
  }
  lines.push("");
  lines.push("Current workflow:");
  lines.push(JSON.stringify(workflow, null, 2));
  lines.push("");
  lines.push("Available skills:");
  for (const skill of availableSkills.slice(0, 30)) {
    lines.push(`- ${skill.id}: ${skill.description}`);
  }
  lines.push("");
  lines.push("Output the fixed workflow as JSON only.");

  return lines.join("\n");
}

// ── Response parsing ───────────────────────────────────────────────────

function parseResponse(content: string, input: ProposerInput): WorkflowYAML {
  // Extract JSON from the response (may be wrapped in markdown code fences)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1]!;
  } else {
    // Try to find raw JSON
    const braceStart = content.indexOf("{");
    const braceEnd = content.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
      jsonStr = content.slice(braceStart, braceEnd + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return normalizeWorkflow(parsed);
  } catch {
    // If parsing fails, create a minimal workflow from the prompt
    return createBlankWorkflow(
      input.prompt.slice(0, 50).replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-").toLowerCase(),
      input.domain,
    );
  }
}

function normalizeWorkflow(raw: Record<string, unknown>): WorkflowYAML {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any;
  const meta = r.metadata ?? {};
  const spec = r.spec ?? {};

  return {
    apiVersion: "agents-cli/v1",
    metadata: {
      name: meta.name ?? "unnamed-workflow",
      description: meta.description ?? "",
      domain: meta.domain ?? "general",
      version: meta.version ?? "0.1.0",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      createdAt: meta.createdAt ?? new Date().toISOString(),
      estimatedDuration: meta.estimatedDuration,
    },
    spec: {
      inputs: normalizeIOList(spec.inputs),
      outputs: normalizeIOList(spec.outputs),
      env: normalizeEnvList(spec.env),
      steps: normalizeSteps(spec.steps),
      dataFlow: normalizeDataFlow(spec.dataFlow),
      errorHandling: {
        defaultAction: spec.errorHandling?.defaultAction ?? "stop",
        maxRetries: spec.errorHandling?.maxRetries ?? 3,
        retryDelay: spec.errorHandling?.retryDelay ?? "5s",
        notifyOnFailure: spec.errorHandling?.notifyOnFailure ?? false,
      },
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeIOList(items: any): Array<{ name: string; type: string; description: string; required: boolean; default?: string }> {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    name: item.name ?? "unnamed",
    type: item.type ?? "string",
    description: item.description ?? "",
    required: item.required ?? false,
    default: item.default,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEnvList(items: any): WorkflowEnvVar[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    name: item.name ?? "UNNAMED",
    description: item.description ?? "",
    required: item.required ?? false,
    default: item.default,
    secret: item.secret ?? false,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSteps(items: any): WorkflowStepSpec[] {
  if (!Array.isArray(items)) return [];
  return items.map((item, idx) => ({
    id: item.id ?? `step-${idx + 1}`,
    skill: item.skill ?? "unknown",
    name: item.name ?? `Step ${idx + 1}`,
    description: item.description ?? "",
    command: item.command ?? "",
    args: Array.isArray(item.args) ? item.args : [],
    inputs: Array.isArray(item.inputs) ? item.inputs : [],
    outputs: Array.isArray(item.outputs) ? item.outputs : [],
    condition: item.condition,
    onFailure: item.onFailure ?? "stop",
    timeout: item.timeout,
    retries: item.retries,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDataFlow(items: any): DataFlowEdge[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    from: item.from ?? "",
    to: item.to ?? "",
    type: item.type ?? "file",
  }));
}

function extractReasoning(content: string): string {
  // Look for reasoning before the JSON block
  const jsonStart = content.indexOf("{");
  if (jsonStart > 0) {
    return content.slice(0, jsonStart).trim();
  }
  return "";
}
