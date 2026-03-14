/**
 * workflow-manifest-inference.ts — Infer SkillWorkflow from analyzed agent scripts.
 *
 * Takes AgentAnalysis results from agent-analyzer.ts and produces an enriched
 * SkillWorkflow with step ordering, data flow, env vars, and duration estimates.
 */

import type { AgentAnalysis } from "./agent-analyzer.js";
import type { SkillWorkflow, WorkflowEnvVar, DataFlowEdge, WorkflowStep } from "./workflow-composer.js";

// ── Step ordering ──────────────────────────────────────────────────────

/**
 * Infer execution order from cross-script deps and file I/O chains.
 * Returns script names in topological order.
 */
export function inferStepOrder(analyses: Map<string, AgentAnalysis>): string[] {
  const names = [...analyses.keys()];
  const graph = new Map<string, Set<string>>();

  // Initialize
  for (const name of names) {
    graph.set(name, new Set());
  }

  // Build dependency edges from cross-script imports
  for (const [name, analysis] of analyses) {
    for (const dep of analysis.crossScriptDeps) {
      // Find matching script (with or without extension)
      const match = names.find(n =>
        n === dep || n === dep + ".py" || n === dep + ".ts" || n === dep + ".js" ||
        n.replace(/\.\w+$/, "") === dep,
      );
      if (match && match !== name) {
        // name depends on match → match must run first
        graph.get(name)!.add(match);
      }
    }
  }

  // Build dependency edges from file I/O chains
  const outputMap = new Map<string, string>(); // artifact → producing script
  for (const [name, analysis] of analyses) {
    for (const output of analysis.fileOutputs) {
      const normalized = normalizeArtifact(output);
      if (normalized) outputMap.set(normalized, name);
    }
  }
  for (const [name, analysis] of analyses) {
    for (const input of analysis.fileInputs) {
      const normalized = normalizeArtifact(input);
      if (!normalized) continue;
      const producer = outputMap.get(normalized);
      if (producer && producer !== name) {
        graph.get(name)!.add(producer);
      }
    }
  }

  // Topological sort (Kahn's algorithm)
  // graph: node → set of its dependencies (nodes that must come before it)
  // reverseGraph: node → set of nodes that depend on it
  const reverseGraph = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  for (const name of names) {
    reverseGraph.set(name, new Set());
    inDegree.set(name, graph.get(name)!.size);
  }
  for (const [name, deps] of graph) {
    for (const dep of deps) {
      reverseGraph.get(dep)!.add(name);
    }
  }

  const queue: string[] = names.filter(n => inDegree.get(n) === 0);
  const sorted: string[] = [];

  while (queue.length > 0) {
    // Sort queue to prefer numeric prefixes
    queue.sort((a, b) => {
      const numA = extractNumericPrefix(a);
      const numB = extractNumericPrefix(b);
      if (numA !== null && numB !== null) return numA - numB;
      if (numA !== null) return -1;
      if (numB !== null) return 1;
      return a.localeCompare(b);
    });

    const current = queue.shift()!;
    sorted.push(current);

    for (const dependent of reverseGraph.get(current) ?? []) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) queue.push(dependent);
    }
  }

  // Handle cycles — add remaining nodes alphabetically
  for (const name of names) {
    if (!sorted.includes(name)) sorted.push(name);
  }

  return sorted;
}

/**
 * Infer data flow edges from file I/O patterns.
 */
export function inferDataFlow(analyses: Map<string, AgentAnalysis>): DataFlowEdge[] {
  const edges: DataFlowEdge[] = [];

  // Map outputs to their producers
  const outputMap = new Map<string, { script: string; artifact: string }>();
  for (const [name, analysis] of analyses) {
    for (const output of analysis.fileOutputs) {
      const normalized = normalizeArtifact(output);
      if (normalized) {
        outputMap.set(normalized, {
          script: name.replace(/\.\w+$/, ""),
          artifact: inferArtifactType(output),
        });
      }
    }
  }

  // Match inputs to outputs
  for (const [name, analysis] of analyses) {
    for (const input of analysis.fileInputs) {
      const normalized = normalizeArtifact(input);
      if (!normalized) continue;
      const producer = outputMap.get(normalized);
      if (producer && producer.script !== name.replace(/\.\w+$/, "")) {
        edges.push({
          from: producer.script,
          to: name.replace(/\.\w+$/, ""),
          artifact: producer.artifact,
        });
      }
    }
  }

  return deduplicateEdges(edges);
}

/**
 * Merge and deduplicate env vars from all scripts.
 */
export function mergeEnvVars(analyses: Map<string, AgentAnalysis>): WorkflowEnvVar[] {
  const seen = new Map<string, WorkflowEnvVar>();

  for (const analysis of analyses.values()) {
    for (const envVar of analysis.envVars) {
      if (seen.has(envVar)) continue;
      seen.set(envVar, {
        name: envVar,
        description: inferEnvVarDescription(envVar),
        required: isLikelyRequired(envVar),
        example: inferEnvVarExample(envVar),
      });
    }
  }

  // Sort: required first, then alphabetical
  return [...seen.values()].sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ── Main inference ─────────────────────────────────────────────────────

/**
 * Infer a complete SkillWorkflow from analyzed scripts.
 */
export function inferWorkflowManifest(
  analyses: Map<string, AgentAnalysis>,
  options?: { name?: string; domain?: string; description?: string },
): SkillWorkflow {
  const stepOrder = inferStepOrder(analyses);
  const dataFlow = inferDataFlow(analyses);
  const envVars = mergeEnvVars(analyses);

  const steps: WorkflowStep[] = stepOrder.map(scriptName => {
    const analysis = analyses.get(scriptName);
    const baseName = scriptName.replace(/\.\w+$/, "");
    const lang = analysis?.language ?? "unknown";

    const command = lang === "python"
      ? `python3 ${scriptName}`
      : lang === "shell"
        ? `bash ${scriptName}`
        : `node ${scriptName}`;

    return {
      name: baseName.replace(/^\d+[_-]/, ""),  // strip numeric prefix
      skill: baseName,
      command,
      args: [],
      onFailure: "stop" as const,
    };
  });

  const name = options?.name ?? inferWorkflowName(analyses);
  const description = options?.description ?? inferDescription(steps, analyses);
  const allDeps = [...new Set(steps.map(s => s.skill))];

  // Estimate duration based on step count and SDK complexity
  const sdkCount = [...analyses.values()].reduce((sum, a) => sum + a.sdkCalls.length, 0);
  const estimatedMinutes = steps.length * 2 + (sdkCount > 5 ? 5 : sdkCount);
  const estimatedDuration = estimatedMinutes <= 5
    ? `${estimatedMinutes}min`
    : `${Math.round(estimatedMinutes)}min`;

  return {
    name,
    description,
    steps,
    triggers: ["manual"],
    dependencies: allDeps,
    envVars,
    dataFlow,
    estimatedDuration,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

function normalizeArtifact(path: string): string | null {
  if (path === "(json input)" || path === "(json output)" || path === "(csv output)") return null;
  // Strip common prefixes
  return path.replace(/^(\.\/|\.\.\/|out\/|data\/|output\/)/, "").toLowerCase();
}

function inferArtifactType(path: string): string {
  if (/\.json$/i.test(path)) return "json";
  if (/\.csv$/i.test(path)) return "csv";
  if (/\.txt$/i.test(path)) return "text";
  if (/\.md$/i.test(path)) return "markdown";
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(path)) return "images";
  if (/\.(mp3|wav|ogg|flac|m4a)$/i.test(path)) return "audio";
  if (/\.(mp4|avi|mov|mkv|webm)$/i.test(path)) return "video";
  if (/\.(pdf)$/i.test(path)) return "pdf";
  return "data";
}

function extractNumericPrefix(name: string): number | null {
  const match = name.match(/^(\d+)/);
  return match ? parseInt(match[1]!, 10) : null;
}

function deduplicateEdges(edges: DataFlowEdge[]): DataFlowEdge[] {
  const seen = new Set<string>();
  return edges.filter(e => {
    const key = `${e.from}→${e.to}:${e.artifact}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferEnvVarDescription(name: string): string {
  const descriptions: Record<string, string> = {
    OPENAI_API_KEY: "OpenAI API key for GPT models",
    ANTHROPIC_API_KEY: "Anthropic API key for Claude models",
    GEMINI_API_KEY: "Google Gemini API key",
    GOOGLE_APPLICATION_CREDENTIALS: "Path to Google Cloud service account JSON",
    REPLICATE_API_TOKEN: "Replicate API token for model inference",
    STABILITY_API_KEY: "Stability AI API key for image generation",
    ELEVENLABS_API_KEY: "ElevenLabs API key for text-to-speech",
    AWS_ACCESS_KEY_ID: "AWS access key for S3/services",
    AWS_SECRET_ACCESS_KEY: "AWS secret access key",
    PINECONE_API_KEY: "Pinecone vector database API key",
    COHERE_API_KEY: "Cohere API key for embeddings/generation",
    MISTRAL_API_KEY: "Mistral AI API key",
    GROQ_API_KEY: "Groq API key for fast inference",
    TOGETHER_API_KEY: "Together AI API key",
    SUPABASE_URL: "Supabase project URL",
    SUPABASE_KEY: "Supabase project API key",
    DATABASE_URL: "Database connection string",
    REDIS_URL: "Redis connection URL",
    SUNO_COOKIE: "Suno.ai authentication cookie for music generation",
  };
  return descriptions[name] ?? `${name} environment variable`;
}

function isLikelyRequired(name: string): boolean {
  // API keys are generally required
  return /_KEY$|_TOKEN$|_SECRET$|_URL$/.test(name) && !/COOKIE$/.test(name);
}

function inferEnvVarExample(name: string): string | undefined {
  if (/_KEY$|_TOKEN$|_SECRET$/.test(name)) return "sk-...";
  if (/_URL$/.test(name)) return "https://...";
  return undefined;
}

function inferWorkflowName(analyses: Map<string, AgentAnalysis>): string {
  const scripts = [...analyses.keys()];
  // Try to find a common prefix or directory-based name
  if (scripts.length === 1) return scripts[0]!.replace(/\.\w+$/, "");

  // Look for a pipeline/main script
  const mainScript = scripts.find(s =>
    /^(main|pipeline|run|orchestrat)/i.test(s),
  );
  if (mainScript) return mainScript.replace(/\.\w+$/, "").replace(/^(main|run)_?/, "");

  // Use common step names to infer purpose
  return "agent-pipeline";
}

function inferDescription(steps: WorkflowStep[], analyses: Map<string, AgentAnalysis>): string {
  const stepNames = steps.map(s => s.name).join(" → ");
  const sdks = new Set<string>();
  for (const analysis of analyses.values()) {
    for (const call of analysis.sdkCalls) sdks.add(call.sdk);
  }
  const sdkList = [...sdks].slice(0, 3).join(", ");
  const sdkPart = sdkList ? ` Uses ${sdkList}.` : "";
  return `Multi-step agent pipeline: ${stepNames}.${sdkPart} Orchestrates ${steps.length} agents in sequence.`;
}
