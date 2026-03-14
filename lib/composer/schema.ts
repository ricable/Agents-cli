/**
 * workflow.yaml schema definition and serialization.
 *
 * Defines the WorkflowYAML interface for fully-generative workflow composition.
 * Uses template-based YAML serialization (no yaml dependency per project rules).
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface WorkflowYAML {
  apiVersion: "agents-cli/v1";
  metadata: WorkflowMetadata;
  spec: WorkflowSpec;
  validation?: WorkflowValidation;
}

export interface WorkflowMetadata {
  name: string;
  description: string;
  domain: string;
  version: string;
  tags: string[];
  author?: string;
  createdAt: string;
  estimatedDuration?: string;
}

export interface WorkflowSpec {
  inputs: WorkflowIO[];
  outputs: WorkflowIO[];
  env: WorkflowEnvVar[];
  steps: WorkflowStepSpec[];
  dataFlow: DataFlowEdge[];
  errorHandling: ErrorStrategy;
}

export interface WorkflowIO {
  name: string;
  type: string;       // "file", "directory", "string", "url", etc.
  description: string;
  required: boolean;
  default?: string;
}

export interface WorkflowEnvVar {
  name: string;
  description: string;
  required: boolean;
  default?: string;
  secret?: boolean;
}

export interface WorkflowStepSpec {
  id: string;
  skill: string;        // skill ID (e.g., "src-ruff")
  name: string;
  description: string;
  command: string;
  args: string[];
  inputs: string[];      // references to spec.inputs or prior step outputs
  outputs: string[];     // named outputs this step produces
  condition?: string;    // shell expression for conditional execution
  onFailure: "stop" | "skip" | "retry";
  timeout?: string;      // e.g., "5m", "30s"
  retries?: number;
}

export interface DataFlowEdge {
  from: string;          // step_id.output_name
  to: string;            // step_id.input_name
  type: string;          // "file", "stdout", "env", "artifact"
}

export interface ErrorStrategy {
  defaultAction: "stop" | "skip" | "retry";
  maxRetries: number;
  retryDelay: string;
  notifyOnFailure: boolean;
}

export interface WorkflowValidation {
  staticChecks: ValidationResult[];
  sandboxResult?: SandboxResult;
  qualityScore: number;
  iterations: number;
}

export interface ValidationResult {
  check: string;
  passed: boolean;
  message: string;
}

export interface SandboxResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

// ── Serialization ──────────────────────────────────────────────────────

/**
 * Serialize a WorkflowYAML to YAML string.
 * Uses template-based approach (no yaml dependency).
 */
export function serializeWorkflowYaml(workflow: WorkflowYAML): string {
  const lines: string[] = [];

  lines.push(`apiVersion: ${workflow.apiVersion}`);
  lines.push("");

  // Metadata
  lines.push("metadata:");
  lines.push(`  name: ${yamlString(workflow.metadata.name)}`);
  lines.push(`  description: ${yamlString(workflow.metadata.description)}`);
  lines.push(`  domain: ${workflow.metadata.domain}`);
  lines.push(`  version: ${workflow.metadata.version}`);
  if (workflow.metadata.tags.length > 0) {
    lines.push(`  tags: [${workflow.metadata.tags.map(yamlString).join(", ")}]`);
  }
  if (workflow.metadata.author) {
    lines.push(`  author: ${yamlString(workflow.metadata.author)}`);
  }
  lines.push(`  createdAt: ${workflow.metadata.createdAt}`);
  if (workflow.metadata.estimatedDuration) {
    lines.push(`  estimatedDuration: ${workflow.metadata.estimatedDuration}`);
  }
  lines.push("");

  // Spec
  lines.push("spec:");

  // Inputs
  if (workflow.spec.inputs.length > 0) {
    lines.push("  inputs:");
    for (const input of workflow.spec.inputs) {
      lines.push(`    - name: ${input.name}`);
      lines.push(`      type: ${input.type}`);
      lines.push(`      description: ${yamlString(input.description)}`);
      lines.push(`      required: ${input.required}`);
      if (input.default) lines.push(`      default: ${yamlString(input.default)}`);
    }
  }

  // Outputs
  if (workflow.spec.outputs.length > 0) {
    lines.push("  outputs:");
    for (const output of workflow.spec.outputs) {
      lines.push(`    - name: ${output.name}`);
      lines.push(`      type: ${output.type}`);
      lines.push(`      description: ${yamlString(output.description)}`);
      lines.push(`      required: ${output.required}`);
    }
  }

  // Env
  if (workflow.spec.env.length > 0) {
    lines.push("  env:");
    for (const env of workflow.spec.env) {
      lines.push(`    - name: ${env.name}`);
      lines.push(`      description: ${yamlString(env.description)}`);
      lines.push(`      required: ${env.required}`);
      if (env.default) lines.push(`      default: ${yamlString(env.default)}`);
      if (env.secret) lines.push(`      secret: true`);
    }
  }

  // Steps
  lines.push("  steps:");
  for (const step of workflow.spec.steps) {
    lines.push(`    - id: ${step.id}`);
    lines.push(`      skill: ${step.skill}`);
    lines.push(`      name: ${yamlString(step.name)}`);
    lines.push(`      description: ${yamlString(step.description)}`);
    lines.push(`      command: ${yamlString(step.command)}`);
    if (step.args.length > 0) {
      lines.push(`      args: [${step.args.map(yamlString).join(", ")}]`);
    }
    if (step.inputs.length > 0) {
      lines.push(`      inputs: [${step.inputs.map(yamlString).join(", ")}]`);
    }
    if (step.outputs.length > 0) {
      lines.push(`      outputs: [${step.outputs.map(yamlString).join(", ")}]`);
    }
    if (step.condition) {
      lines.push(`      condition: ${yamlString(step.condition)}`);
    }
    lines.push(`      onFailure: ${step.onFailure}`);
    if (step.timeout) lines.push(`      timeout: ${step.timeout}`);
    if (step.retries) lines.push(`      retries: ${step.retries}`);
  }

  // Data flow
  if (workflow.spec.dataFlow.length > 0) {
    lines.push("  dataFlow:");
    for (const edge of workflow.spec.dataFlow) {
      lines.push(`    - from: ${yamlString(edge.from)}`);
      lines.push(`      to: ${yamlString(edge.to)}`);
      lines.push(`      type: ${edge.type}`);
    }
  }

  // Error handling
  lines.push("  errorHandling:");
  lines.push(`    defaultAction: ${workflow.spec.errorHandling.defaultAction}`);
  lines.push(`    maxRetries: ${workflow.spec.errorHandling.maxRetries}`);
  lines.push(`    retryDelay: ${workflow.spec.errorHandling.retryDelay}`);
  lines.push(`    notifyOnFailure: ${workflow.spec.errorHandling.notifyOnFailure}`);

  lines.push("");
  return lines.join("\n");
}

/**
 * Deserialize a YAML string to WorkflowYAML.
 * Simple line-based parser (no yaml dependency).
 */
export function deserializeWorkflowYaml(yaml: string): WorkflowYAML {
  // Simple key-value extraction for top-level fields
  const getValue = (key: string): string | undefined => {
    const regex = new RegExp(`^\\s*${key}:\\s*(.+)$`, "m");
    const match = yaml.match(regex);
    return match?.[1]?.trim().replace(/^["']|["']$/g, "");
  };

  const getList = (key: string): string[] => {
    const val = getValue(key);
    if (!val) return [];
    if (val.startsWith("[")) {
      return val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }
    return [val];
  };

  return {
    apiVersion: "agents-cli/v1",
    metadata: {
      name: getValue("name") ?? "unnamed",
      description: getValue("description") ?? "",
      domain: getValue("domain") ?? "general",
      version: getValue("version") ?? "0.1.0",
      tags: getList("tags"),
      createdAt: getValue("createdAt") ?? new Date().toISOString(),
      estimatedDuration: getValue("estimatedDuration"),
    },
    spec: {
      inputs: [],
      outputs: [],
      env: [],
      steps: [],
      dataFlow: [],
      errorHandling: {
        defaultAction: "stop",
        maxRetries: 3,
        retryDelay: "5s",
        notifyOnFailure: false,
      },
    },
  };
}

/**
 * Create a blank WorkflowYAML template.
 */
export function createBlankWorkflow(name: string, domain = "general"): WorkflowYAML {
  return {
    apiVersion: "agents-cli/v1",
    metadata: {
      name,
      description: "",
      domain,
      version: "0.1.0",
      tags: [],
      createdAt: new Date().toISOString(),
    },
    spec: {
      inputs: [],
      outputs: [],
      env: [],
      steps: [],
      dataFlow: [],
      errorHandling: {
        defaultAction: "stop",
        maxRetries: 3,
        retryDelay: "5s",
        notifyOnFailure: false,
      },
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Escape a string for YAML output */
function yamlString(s: string): string {
  if (!s) return '""';
  // Quote if contains special chars
  if (/[:{}\[\],&*#?|<>=!%@`]/.test(s) || s.includes("\n") || s.startsWith(" ") || s.endsWith(" ")) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}
