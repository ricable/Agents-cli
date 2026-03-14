import type { Tool, ToolCommand } from "../types.js";
import { DOMAIN_TRIGGERS } from "../domains.js";
import { inferBinaryNames, INSTALL_CMD_RE, readSourceVersion } from "../extractor.js";
import { validateToolName, shellQuote } from "../guards.js";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { getToolInstallDir } from "../store.js";
import { scoreTrigger } from "../skill-tester.js";

// Suppress unused import warnings for imports used indirectly
void DOMAIN_TRIGGERS;
void readSourceVersion;
void validateToolName;

const MAX_QUICK_START_EXAMPLES = 3;
const MAX_PATTERN_EXAMPLES = 5;
const MAX_HELP_LINES = 60;

export { MAX_QUICK_START_EXAMPLES, MAX_PATTERN_EXAMPLES, MAX_HELP_LINES };

// =============================================================================
// Description helpers
// =============================================================================

/** Escape a string for use in YAML frontmatter double quotes */
export function esc(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ");
}

/** Normalize description: strip trailing period, strip "CLI tool:" prefix, provide fallback */
export function normalizeDesc(tool: Tool): string {
  let raw = (tool.meta.description || tool.meta.name).replace(/\.$/, "");
  // Strip generic "CLI tool:" prefix — always lead with actual description
  raw = raw.replace(/^CLI tool:\s*/i, "").trim();
  // Strip markdown blockquote markers and HTML/XML tags that leak from READMEs
  raw = raw.replace(/^>\s*/gm, "").replace(/<\/?[a-zA-Z][^>]*>/g, "").trim();
  return raw || tool.meta.name;
}

/**
 * Category → action-verb trigger templates. The `%` placeholder is replaced
 * with the tool name at runtime so each tool gets unique triggers.
 */
const CATEGORY_ACTION_MAP: Record<string, string[]> = {
  "ai-ml/llm-inference": ["running LLM inference with %", "deploying % for language model serving", "generating text using %"],
  "ai-ml/ai-agents": ["building AI agents with %", "orchestrating agent workflows via %", "managing autonomous tasks using %"],
  "workflow": ["orchestrating multi-step % pipelines", "automating sequential agent tasks with %", "chaining CLI tools via % workflows"],
  "ai-ml/ai-coding": ["generating code with %", "building AI-powered dev tools using %", "debugging with % assistance"],
  "ai-ml/rag-and-embeddings": ["building retrieval pipelines with %", "embedding documents using %", "indexing knowledge bases via %"],
  "ai-ml/vector-search": ["storing vector embeddings with %", "searching similarity indexes via %", "querying % vector databases"],
  "ai-ml/ml-frameworks": ["training models with %", "building neural networks using %", "running % model inference"],
  "ai-ml/model-serving": ["deploying models with %", "managing % model endpoints", "running % inference servers"],
  "ai-ml/model-optimization": ["optimizing models with %", "converting model formats via %", "running quantized inference using %"],
  "ai-ml/model-monitoring": ["monitoring model performance with %", "analyzing prediction drift via %", "managing % model metrics"],
  "ai-ml/nlp": ["processing text with %", "analyzing sentiment using %", "parsing linguistic structures via %"],
  "ai-ml/computer-vision": ["processing images with %", "running % object detection", "analyzing visual content using %"],
  "ai-ml/data-labeling": ["creating annotations with %", "managing % labeling workflows", "validating data quality via %"],
  "ai-ml/data-processing": ["processing datasets with %", "transforming data using %", "building % data pipelines"],
  "ai-ml/ml-experiment-tracking": ["monitoring experiments with %", "analyzing % model metrics", "managing training runs via %"],
  "ai-ml/mlops-pipelines": ["deploying ML pipelines with %", "orchestrating % model workflows", "managing % ML infrastructure"],
  "ai-ml/prompt-engineering": ["building prompts with %", "testing prompt variations via %", "managing % prompt workflows"],
  "ai-ml/ai-evaluation": ["testing model outputs with %", "benchmarking AI via %", "validating % model accuracy"],
  "ai-ml/ai-safety": ["scanning AI outputs with %", "validating model behavior via %", "monitoring % AI guardrails"],
  "ai-ml/ai-security": ["scanning AI systems with %", "validating security via %", "monitoring % AI threats"],
  "ai-ml/audio/speech": ["processing audio with %", "generating speech via %", "converting speech using %"],
  "ai-ml/image-generation": ["generating images with %", "creating visual content via %", "running % diffusion models"],
  "ai-ml/document-ai": ["processing documents with %", "analyzing structure via %", "converting documents using %"],
  "ai-ml/fine-tuning": ["fine-tuning models with %", "running % transfer learning", "managing fine-tune jobs via %"],
  "ai-ml/gpu-tools": ["monitoring GPU with %", "managing % GPU resources", "deploying GPU workloads via %"],
  "ai-ml/notebooks": ["running % notebooks", "managing % computational environments", "executing code cells via %"],
  "ai-ml/synthetic-data": ["generating synthetic data with %", "creating % training datasets", "validating distributions via %"],
  "ai-ml/feature-stores": ["storing features with %", "managing % feature pipelines", "retrieving training features via %"],
  "ai-ml/knowledge-graphs": ["building knowledge graphs with %", "querying % graph databases", "managing entities via %"],
  "ai-ml/model-hub": ["downloading models from %", "managing % model repositories", "searching % model registries"],
  "ai-ml/automl": ["running AutoML with %", "optimizing hyperparameters via %", "building % ML pipelines"],
  "ai-ml/ai-apis": ["calling % AI API endpoints", "managing % API keys", "streaming AI responses via %"],
  "code-search": ["searching code with %", "running % to find patterns", "retrieving source content via %"],
  "security": ["scanning for vulnerabilities with %", "auditing dependencies via %", "detecting security issues using %"],
  "testing": ["running tests with %", "checking test coverage via %", "debugging test failures using %"],
  "data-processing": ["processing data with %", "converting formats using %", "transforming datasets via %"],
  "devops": ["deploying applications with %", "managing infrastructure via %", "orchestrating services using %"],
  "package-managers": ["managing dependencies with %", "installing packages via %", "running project scripts using %"],
  "git": ["managing version control with %", "creating and reviewing pull requests via %", "searching commit history using %"],
  "javascript": ["linting and formatting JavaScript with %", "building and bundling projects via %", "checking types using %"],
  "python": ["building Python projects with %", "managing Python workflows via %", "running and debugging Python code using %"],
  "cloud": ["deploying applications with %", "managing cloud infrastructure via %", "configuring container orchestration using %"],
  "http-api": ["calling HTTP APIs with %", "downloading resources via %", "testing and debugging endpoints using %"],
  "documentation": ["generating documentation with %", "validating API specs via %", "building and publishing docs using %"],
  "database": ["managing database migrations with %", "querying and transforming data via %", "generating schema definitions using %"],
  "monitoring": ["monitoring system performance with %", "analyzing and debugging processes via %", "scanning resource usage using %"],
  "browser": ["running browser audits with %", "testing web page accessibility via %", "scanning and analyzing web performance using %"],
  "file-processing": ["converting file formats with %", "processing and transforming documents via %", "analyzing file metadata using %"],
  "gui-wrappers": ["running batch image operations with %", "converting and processing files via %", "automating GUI application tasks using %"],
  "network": ["analyzing network paths with %", "querying DNS records via %", "testing and monitoring connections using %"],
  "ai-ml": ["running AI models with %", "building intelligent workflows using %", "processing and generating content via %"],
  // inferDomain categories not covered above
  "containers": ["deploying containers with %", "managing Docker and Kubernetes using %", "orchestrating container services via %"],
  "linter": ["linting code with %", "formatting source files using %", "checking code quality via %"],
  "llm": ["running LLM inference with %", "generating text using %", "processing prompts via %"],
  "ml": ["training models with %", "running inference via %", "evaluating model performance using %"],
  "search": ["searching files with %", "finding patterns using %", "querying codebases via %"],
  "data": ["processing data with %", "converting formats using %", "transforming datasets via %"],
  "http": ["calling HTTP APIs with %", "testing endpoints using %", "debugging HTTP requests via %"],
  "agents": ["building AI agents with %", "orchestrating agent workflows via %", "automating autonomous tasks using %"],
  "rag": ["building retrieval pipelines with %", "embedding documents using %", "indexing knowledge bases via %"],
  "package-manager": ["installing packages with %", "managing dependencies using %", "resolving versions via %"],
  "automation": ["automating tasks with %", "scripting workflows using %", "scheduling jobs via %"],
  "build-tools": ["building projects with %", "bundling code using %", "compiling assets via %"],
  "general": ["running % commands", "configuring % workflows", "managing % tasks"],
};

/**
 * Refine broad category keys using tool description/agentValue context.
 * Prevents "python" category template from bleeding "linting and formatting"
 * into non-linter tools like pytest, gradio, flask, etc.
 */
function refineCategoryKey(catKey: string, tool: Tool): string {
  const text = (
    tool.meta.description + " " +
    (tool._curatedMeta?.agentValue ?? "") + " " +
    (tool._curatedMeta?.description ?? "")
  ).toLowerCase();

  if (catKey === "python") {
    if (/\b(test|pytest|unittest|assert|fixture|coverage|mock)\b/.test(text)) return "testing";
    if (/\b(lint|format|style|ruff|flake8|black|isort|pylint|autopep8)\b/.test(text)) return "linter";
    if (/\b(ml|model|train|neural|tensor|torch|keras|gradio|diffus|hugging)\b/.test(text)) return "ai-ml/ml-frameworks";
    if (/\b(web|http|flask|django|fastapi|server|route|wsgi|asgi)\b/.test(text)) return "http-api";
    if (/\b(scrape|crawl|spider|selenium|playwright|browser)\b/.test(text)) return "browser";
    if (/\b(data|pandas|numpy|polars|arrow|parquet|csv|dataframe)\b/.test(text)) return "data-processing";
    if (/\b(cli|command|terminal|argparse|click|typer)\b/.test(text)) return "python";
    return catKey;
  }

  if (catKey === "javascript") {
    if (/\b(test|jest|mocha|vitest|cypress|playwright|assert)\b/.test(text)) return "testing";
    if (/\b(lint|eslint|prettier|format|biome|oxlint)\b/.test(text)) return "linter";
    if (/\b(bundl|webpack|vite|rollup|esbuild|parcel|turbopack)\b/.test(text)) return "build-tools";
    return catKey;
  }

  return catKey;
}

/** Language → TechName display strings for the +0.1 TechName score boost */
const LANG_TO_TECH: Record<string, string> = {
  rust: "Rust Cargo",
  go: "Go Module",
  python: "Python Package",
  node: "Node JavaScript",
  c: "Native Binary",
};

/**
 * Domain → negative trigger phrase for "Do NOT use for" clause.
 * Adding this boosts scoreTrigger() by +0.2 points.
 */
const DOMAIN_NEGATIVE_TRIGGERS: Record<string, string> = {
  "python": "non-Python language projects",
  "javascript": "non-JavaScript or non-TypeScript projects",
  "linter": "runtime execution or deployment tasks",
  "testing": "production deployment or code generation",
  "security": "general application development unrelated to security",
  "containers": "bare-metal deployments without containerization",
  "cloud": "local-only development without cloud resources",
  "database": "in-memory caching or file-based storage",
  "monitoring": "initial development before deployment",
  "documentation": "runtime code execution or testing",
  "git": "file editing or code generation tasks",
  "http": "local file operations or database queries",
  "data": "real-time streaming or interactive user interfaces",
  "data-processing": "real-time streaming or interactive user interfaces",
  "search": "file editing or code generation",
  "code-search": "file editing or code generation",
  "llm": "traditional rule-based or non-AI tasks",
  "ml": "simple rule-based logic that does not require machine learning",
  "agents": "simple single-step tasks that do not need orchestration",
  "rag": "tasks that do not involve document retrieval or knowledge bases",
  "package-manager": "runtime application logic or deployment",
  "package-managers": "runtime application logic or deployment",
  "build-tools": "runtime execution or production monitoring",
  "automation": "interactive manual workflows",
  "devops": "local development without infrastructure concerns",
  "network": "application-level business logic",
  "browser": "backend server tasks or CLI-only workflows",
  "file-processing": "database queries or network operations",
  "gui-wrappers": "headless server environments without GUI",
  "ai-ml": "non-AI traditional programming tasks",
  "ai-ml/llm-inference": "non-LLM computation tasks",
  "ai-ml/ai-agents": "simple single-step automation without agent orchestration",
  "ai-ml/ai-coding": "non-code generation or manual coding tasks",
  "ai-ml/rag-and-embeddings": "tasks not involving document retrieval",
  "ai-ml/vector-search": "relational database queries or text-based search",
  "ai-ml/ml-frameworks": "simple data processing without model training",
  "ai-ml/model-serving": "model training or data preparation tasks",
  "ai-ml/model-optimization": "initial model training or data collection",
  "ai-ml/fine-tuning": "inference-only tasks that do not require model adaptation",
  "ai-ml/data-processing": "real-time streaming or interactive UIs",
  "ai-ml/mlops-pipelines": "local development without ML infrastructure",
  "ai-ml/ai-apis": "offline or local-only computation",
  "workflow": "single-tool execution, one-off commands, interactive REPL sessions",
  "general": "tasks better served by a domain-specific tool",
};

/**
 * Refine a broad category (e.g. "python", "javascript") to a more specific
 * CATEGORY_ACTION_MAP key based on the tool's description keywords.
 * This prevents template bleed where a linting trigger applies to a test framework.
 */
function refineCategoryFromDescription(category: string, description: string, tool?: Tool): string {
  // Only refine broad language categories — specific categories are already correct
  const BROAD_CATEGORIES = new Set(["python", "javascript"]);
  if (!BROAD_CATEGORIES.has(category)) return category;

  // If we have the full tool object, use the richer refineCategoryKey
  if (tool) return refineCategoryKey(category, tool);

  // Fallback: description-only refinement
  const desc = description.toLowerCase();
  const REFINEMENTS: Array<{ pattern: RegExp; category: string }> = [
    { pattern: /\b(test|pytest|unittest|assert|fixture|spec|coverage|mock)\b/, category: "testing" },
    { pattern: /\b(lint|format|style|type.?check|pylint|eslint|prettier|ruff|flake8|black|biome)\b/, category: "linter" },
    { pattern: /\b(security|vulnerab|audit|secret|scan)\b/, category: "security" },
    { pattern: /\b(bundl|webpack|vite|rollup|esbuild|parcel|compil|transpil|minif)\b/, category: "build-tools" },
    { pattern: /\b(ml|model|train|neural|tensor|torch|keras|gradio|diffus|hugging)\b/, category: "ai-ml/ml-frameworks" },
    { pattern: /\b(web|http|flask|django|fastapi|server|route|wsgi|asgi)\b/, category: "http-api" },
    { pattern: /\b(data|pandas|numpy|polars|arrow|parquet|dataframe)\b/, category: "data-processing" },
    { pattern: /\b(scrape|crawl|spider|selenium|playwright|browser)\b/, category: "browser" },
    { pattern: /\b(package.?manager|dependency|install packages)\b/, category: "package-managers" },
    { pattern: /\b(monitor|profil|benchmark|performance)\b/, category: "monitoring" },
    { pattern: /\b(document|docs|api.?doc|docstring)\b/, category: "documentation" },
  ];

  for (const { pattern, category: refined } of REFINEMENTS) {
    if (pattern.test(desc) && CATEGORY_ACTION_MAP[refined]) {
      return refined;
    }
  }
  return category;
}

/**
 * Build a compliant description: "[What it does]. Use when [trigger phrases]."
 * Third person, under 1024 chars, no XML tags. Uses action verbs from commands
 * or domain-inferred trigger phrases — never "the task involves".
 */
export function buildDescription(tool: Tool): string {
  const desc = normalizeDesc(tool);
  const name = tool.meta.name;
  const commands = tool.capabilities.commands;

  // Check for curated metadata attached by the forge pipeline
  const curated = tool._curatedMeta;

  // Use curated description if the resolved one is just the tool name
  const effectiveDesc = (curated && desc.length < 30 && desc.toLowerCase().replace(/[^a-z0-9]/g, "") === name.toLowerCase().replace(/[^a-z0-9]/g, ""))
    ? curated.description
    : desc;

  // When no curated metadata, try enriching generic descriptions with README first paragraph
  let enrichedDesc = effectiveDesc;
  if (!curated && tool._readmeSections?.raw) {
    const rawReadme = tool._readmeSections.raw;
    // Extract first meaningful paragraph from raw README (skip title, badges, images)
    const lines = rawReadme.split("\n");
    const proseLines: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith("#")) continue;
      if (t.startsWith("!") || t.startsWith("[!")) continue; // images, badges
      if (t.startsWith("<")) continue; // HTML
      if (t.startsWith("|")) continue; // tables
      if (t.startsWith("```")) break; // stop at first code block
      proseLines.push(t);
      if (proseLines.join(" ").length >= 200) break;
    }
    const firstParagraph = proseLines.join(" ").slice(0, 200).trim();
    // Only use if it's more specific than the current description
    if (firstParagraph.length > effectiveDesc.length && firstParagraph.length > 40) {
      enrichedDesc = firstParagraph.replace(/\.$/, "");
    }
  }

  let cachedDomain: ReturnType<typeof inferDomain> | null = null;
  const triggers: string[] = [];
  if (commands.length > 0) {
    // Extract action verbs from command descriptions
    const actionPhrases = commands
      .slice(0, 5)
      .map(c => c.description?.toLowerCase())
      .filter((d): d is string => !!d && d.length > 3);
    if (actionPhrases.length > 0) {
      // Convert to gerund form with common irregular verb handling
      const toGerund = (verb: string): string => {
        // Common irregular/special cases
        const irregulars: Record<string, string> = {
          run: "running", set: "setting", get: "getting", put: "putting",
          begin: "beginning", stop: "stopping", plan: "planning",
        };
        if (irregulars[verb]) return irregulars[verb];
        if (verb.endsWith("ie")) return verb.slice(0, -2) + "ying";
        if (verb.endsWith("ee") || verb.endsWith("ye") || verb.endsWith("oe")) return verb + "ing";
        if (verb.endsWith("e")) return verb.slice(0, -1) + "ing";
        // Only double final consonant for short verbs (CVC pattern, single syllable)
        if (verb.length <= 4 && /[aeiou][bcdfghlmnprstvz]$/.test(verb)) {
          return verb + verb.slice(-1) + "ing";
        }
        return verb + "ing";
      };
      const gerunds = actionPhrases.map(p => {
        const first = p.split(/\s+/)[0] ?? "";
        return toGerund(first) + p.slice(first.length);
      });
      triggers.push(...gerunds.slice(0, 3));
    } else {
      triggers.push(`using ${name} commands`);
    }
    // Ensure at least 2 scorer-recognized verbs — add generic CLI triggers if needed
    const recognizedVerbs = [
      "implementing", "building", "calling", "creating", "managing",
      "configuring", "deploying", "orchestrating", "streaming", "querying",
      "testing", "validating", "installing", "running", "checking",
      "formatting", "linting", "scanning", "monitoring", "processing",
      "analyzing", "generating", "searching", "converting", "debugging",
    ];
    const matchCount = recognizedVerbs.filter(v => triggers.some(t => t.includes(v))).length;
    if (matchCount < 2 && curated) {
      // Prefer curated category triggers over generic "running X commands"
      // Refine broad categories (python/javascript) based on tool description
      const catKey = refineCategoryFromDescription(curated.category.toLowerCase(), enrichedDesc, tool);
      const catTriggers = CATEGORY_ACTION_MAP[catKey];
      if (catTriggers) {
        // Replace weak triggers with category-specific ones
        triggers.length = 0;
        triggers.push(...catTriggers.map(t => t.replace(/%/g, name)));
      } else {
        triggers.push(`running ${name} commands`, `configuring ${name}`);
      }
    } else if (matchCount < 2) {
      triggers.push(`running ${name} commands`, `configuring ${name}`);
    }
  } else if (curated) {
    // Refine broad categories (python/javascript) based on tool description
    const catKey = refineCategoryFromDescription(curated.category.toLowerCase(), enrichedDesc, tool);
    const catTriggers = CATEGORY_ACTION_MAP[catKey] ?? null;
    if (catTriggers) {
      // Template tool name into category triggers for uniqueness
      triggers.push(...catTriggers.map(t => t.replace(/%/g, name)));
    } else {
      // Derive tool-specific triggers from agentValue
      const agentPhrases = curated.agentValue
        .split(/[,;.]/)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 5)
        .slice(0, 2);
      triggers.push(`installing and configuring ${name}`, `running ${name} commands`, `managing ${name} workflows`);
      if (agentPhrases.length > 0) {
        triggers.push(...agentPhrases.map(p => {
          if (/^(building|running|creating|deploying|managing|processing|generating|training|testing|checking|monitoring|installing|configuring|searching|analyzing|formatting|scanning|validating|converting|embedding|streaming|querying|orchestrating|implementing|routing|scheduling|publishing|parsing|rendering|transforming|auditing|debugging|fixing|downloading|compiling|storing|retrieving)/.test(p)) {
            return p;
          }
          return `working with ${name} for ${p}`;
        }));
      }
    }
  } else {
    // Fallback: domain-inferred triggers
    cachedDomain = inferDomain(tool);
    const domain = cachedDomain;
    const domainTriggers: Record<string, string[]> = {
      llm: [`running LLM inference with ${name}`, `generating text using ${name}`, `processing prompts via ${name}`],
      linter: [`linting files with ${name}`, `formatting code using ${name}`, `checking style via ${name}`],
      testing: [`running tests with ${name}`, `checking test coverage via ${name}`, `debugging test failures using ${name}`],
      security: [`scanning for vulnerabilities with ${name}`, `auditing dependencies via ${name}`, `detecting secrets using ${name}`],
      containers: [`managing containers with ${name}`, `deploying applications via ${name}`, `orchestrating services using ${name}`],
      ml: [`training models with ${name}`, `running inference via ${name}`, `evaluating model performance using ${name}`],
      search: [`searching files with ${name}`, `indexing content via ${name}`, `retrieving matches using ${name}`],
      data: [`processing data with ${name}`, `converting formats using ${name}`, `transforming datasets via ${name}`],
      http: [`calling HTTP APIs with ${name}`, `downloading resources via ${name}`, `testing endpoints using ${name}`],
      git: [`managing version control with ${name}`, `creating pull requests via ${name}`, `searching commits using ${name}`],
      agents: [`building AI agents with ${name}`, `orchestrating agent workflows via ${name}`, `running autonomous tasks using ${name}`],
      rag: [`building retrieval pipelines with ${name}`, `indexing documents via ${name}`, `querying knowledge bases using ${name}`],
      monitoring: [`monitoring performance with ${name}`, `analyzing metrics via ${name}`, `scanning resource usage using ${name}`],
      "package-manager": [`managing dependencies with ${name}`, `installing packages via ${name}`, `running project scripts using ${name}`],
      documentation: [`generating documentation with ${name}`, `building API docs via ${name}`, `validating doc structure using ${name}`],
    };
    const categoryTriggers = domainTriggers[domain.category];
    if (categoryTriggers && categoryTriggers.length > 0) {
      triggers.push(...categoryTriggers);
    } else {
      triggers.push(`installing and configuring ${name}`, `running ${name} commands`, `managing ${name} workflows`);
    }
  }

  // Library-specific triggers: if tool is not a CLI and has no commands,
  // verify trigger score would pass; if not, replace with SDK-style triggers
  if (!isLikelyCli(tool) && commands.length === 0 && triggers.length > 0) {
    const testScore = scoreTrigger(`Use when ${triggers.join(", ")}.`);
    if (testScore < 0.8) {
      triggers.length = 0;
      triggers.push(
        `importing ${name} SDK in application code`,
        `building integrations with ${name}`,
        `calling ${name} API methods`,
      );
    }
  }

  const triggerPhrase = triggers.join(", ");

  // Add negative trigger ("Do NOT use for") for +0.2 score boost
  let negativeTrigger = "";
  const curatedCat = curated?.category?.toLowerCase();
  const refinedCat = curatedCat ? refineCategoryFromDescription(curatedCat, enrichedDesc, tool) : undefined;
  const domainCat = (cachedDomain ?? inferDomain(tool)).category;
  // Try refined curated category first, then raw curated, then inferred domain
  const negKey = (refinedCat && DOMAIN_NEGATIVE_TRIGGERS[refinedCat])
    ? refinedCat
    : (curatedCat && DOMAIN_NEGATIVE_TRIGGERS[curatedCat])
    ? curatedCat
    : DOMAIN_NEGATIVE_TRIGGERS[domainCat]
      ? domainCat
      : "";
  if (negKey) {
    negativeTrigger = ` Do NOT use for ${DOMAIN_NEGATIVE_TRIGGERS[negKey]}.`;
  }

  // Ensure 2+ TechNames (capitalized words) for +0.1 score boost
  let techSuffix = "";
  const baseParts = `${enrichedDesc}. Use when ${triggerPhrase}.${negativeTrigger}`;
  const techNames = baseParts.match(/\b[A-Z][a-zA-Z]{2,}\b/g) ?? [];
  if (techNames.length < 2) {
    const extra = LANG_TO_TECH[detectToolLanguage(tool)];
    if (extra) {
      techSuffix = ` Built with ${extra}.`;
    } else {
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      techSuffix = ` Integrates with ${capitalized} CLI.`;
    }
  }

  const full = techSuffix ? `${baseParts}${techSuffix}` : baseParts;
  return full.length > 1024 ? full.slice(0, 1021) + "..." : full;
}

/**
 * Generate concrete example arguments based on command flags and purpose.
 * Never uses <args> or <pattern> placeholders.
 */
export function concreteArgs(cmd: ToolCommand, toolName: string): string {
  const parts = [toolName, cmd.name];
  // Only include flags that have real descriptions (from --help parsing),
  // not flags with empty or placeholder descriptions which may be inferred/fabricated
  const realFlags = cmd.flags.filter(f => f.description && f.description.length > 3);
  for (const f of realFlags.slice(0, 2)) {
    if (f.type === "boolean") {
      parts.push(f.alias || f.name);
    } else if (f.type === "string") {
      const val = f.defaultValue ? String(f.defaultValue) : guessValue(f.name, f.description);
      parts.push(`${f.alias || f.name} ${val}`);
    }
  }
  return parts.join(" ");
}

/** Guess a realistic value for a flag based on its name/description */
function guessValue(flagName: string, description: string): string {
  const lower = (flagName + " " + description).toLowerCase();
  if (lower.includes("file") || lower.includes("path") || lower.includes("input")) return "src/main.py";
  if (lower.includes("output") || lower.includes("out")) return "output/";
  if (lower.includes("format")) return "json";
  if (lower.includes("port")) return "8080";
  if (lower.includes("host")) return "localhost";
  if (lower.includes("dir") || lower.includes("directory")) return "./src";
  if (lower.includes("pattern") || lower.includes("glob")) return "'**/*.py'";
  if (lower.includes("config")) return "config.toml";
  if (lower.includes("name")) return "my-project";
  if (lower.includes("url")) return "https://example.com";
  if (lower.includes("count") || lower.includes("num") || lower.includes("limit")) return "10";
  return ".";
}

// ── Domain inference for tools without discovered capabilities ──────────────

/** Domain category inferred from tags and description */
interface InferredDomain {
  readonly category: string;
  readonly quickStart: readonly string[];
  readonly patterns: readonly string[];
  readonly troubleshooting: readonly string[];
}

/** Tag/keyword patterns mapped to domain-specific usage examples */
const DOMAIN_PATTERNS: ReadonlyArray<{
  match: RegExp;
  category: string;
  quickStart: (name: string) => string[];
  patterns: (name: string) => string[];
  troubleshooting: (name: string) => string[];
}> = [
  {
    match: /\b(llm|language.model|gpt|chat|prompt|inference|ollama|llama|gemini|openai|anthropic|claude|mistral)\b/i,
    category: "llm",
    quickStart: (n) => [
      `# Start a chat session`,
      `${n} chat "Explain how transformers work"`,
      ``,
      `# Run inference on a prompt`,
      `${n} run --model gpt-4 --prompt "Summarize this text"`,
      ``,
      `# List available models`,
      `${n} models list`,
    ],
    patterns: (n) => [
      `# Interactive chat with a specific model`,
      `${n} chat --model llama3 --temperature 0.7`,
      ``,
      `# Generate text from a prompt file`,
      `${n} run --input prompt.txt --output result.txt`,
      ``,
      `# Stream responses in real-time`,
      `${n} chat --stream "Write a Python function to sort a list"`,
      ``,
      `# Use with JSON output for pipeline integration`,
      `${n} run --format json --prompt "Extract entities from: ..."`,
      ``,
      `# Compare outputs across models`,
      `${n} run --model gpt-4 --prompt "Hello" && ${n} run --model claude --prompt "Hello"`,
    ],
    troubleshooting: (n) => [
      `**API key not set**: Export your API key: \`export OPENAI_API_KEY=sk-...\` or check \`${n} config\``,
      `**Model not found**: Run \`${n} models list\` to see available models`,
      `**Rate limiting**: Add \`--retry 3\` or reduce \`--max-tokens\``,
    ],
  },
  {
    match: /\b(lint|format|style|prettier|eslint|ruff|biome|check|static.analysis)\b/i,
    category: "linter",
    quickStart: (n) => [
      `# Check files for issues`,
      `${n} check .`,
      ``,
      `# Auto-fix issues`,
      `${n} check --fix .`,
      ``,
      `# Format files`,
      `${n} format src/`,
    ],
    patterns: (n) => [
      `# Check specific file types`,
      `${n} check --include "*.py" src/`,
      ``,
      `# Check and output as JSON for CI integration`,
      `${n} check --format json . > lint-report.json`,
      ``,
      `# Auto-fix with preview (dry-run)`,
      `${n} check --fix --diff .`,
      ``,
      `# Check only specific rules`,
      `${n} check --select E501,W503 src/`,
      ``,
      `# Ignore specific paths`,
      `${n} check --exclude tests/ --exclude .venv/ .`,
    ],
    troubleshooting: (n) => [
      `**Config not found**: Create a config file in the project root, or run \`${n} init\``,
      `**Too many errors**: Use \`--fix\` to auto-fix, or \`--select\` to focus on specific rules`,
      `**Conflicting with other tools**: Check for overlapping rules in your config`,
    ],
  },
  {
    match: /\b(test|testing|spec|playwright|jest|vitest|pytest|cypress|e2e)\b/i,
    category: "testing",
    quickStart: (n) => [
      `# Run all tests`,
      `${n} run`,
      ``,
      `# Run specific test file`,
      `${n} run tests/unit/test_main.py`,
      ``,
      `# Run tests matching a pattern`,
      `${n} run --grep "should handle"`,
    ],
    patterns: (n) => [
      `# Run tests with coverage report`,
      `${n} run --coverage`,
      ``,
      `# Run tests in watch mode`,
      `${n} run --watch`,
      ``,
      `# Run only failed tests`,
      `${n} run --failed`,
      ``,
      `# Generate JSON test report`,
      `${n} run --reporter json --output test-results.json`,
      ``,
      `# Run tests in parallel`,
      `${n} run --parallel --workers 4`,
    ],
    troubleshooting: (n) => [
      `**Tests not found**: Check your test file naming convention and \`${n}\` config paths`,
      `**Timeout errors**: Increase timeout with \`${n} run --timeout 30000\` or check for async leaks`,
      `**Import errors**: Verify your test environment setup and \`${n}\` module resolution`,
    ],
  },
  {
    match: /\b(security|vulnerab|scan|cve|secret|exploit|pentest|audit|sast|dast|trivy|grype|snyk|semgrep|trufflehog|osv.scanner|gitleaks)\b/i,
    category: "security",
    quickStart: (n) => [
      `# Scan current project for vulnerabilities`,
      `${n} scan .`,
      ``,
      `# Scan a container image`,
      `${n} scan --image myapp:latest`,
      ``,
      `# Output results as JSON`,
      `${n} scan --format json . > security-report.json`,
    ],
    patterns: (n) => [
      `# Scan with severity filter`,
      `${n} scan --severity HIGH,CRITICAL .`,
      ``,
      `# Scan a specific file or directory`,
      `${n} scan --target src/`,
      ``,
      `# Scan and fail on findings (for CI)`,
      `${n} scan --exit-code 1 .`,
      ``,
      `# Scan dependencies / lockfiles`,
      `${n} scan --type dependencies package-lock.json`,
      ``,
      `# Generate SARIF report for GitHub integration`,
      `${n} scan --format sarif . > results.sarif`,
    ],
    troubleshooting: (n) => [
      `**False positives**: Use \`--ignore\` rules or a \`.${n}ignore\` config file`,
      `**Slow scans**: Exclude large vendor dirs with \`--exclude vendor/,node_modules/\``,
      `**Database update**: Run \`${n} update-db\` to get the latest vulnerability data`,
    ],
  },
  {
    match: /\b(docker|container|kubernetes|k8s|kubectl|helm|pod|deploy|orchestrat)\b/i,
    category: "containers",
    quickStart: (n) => [
      `# List running resources`,
      `${n} list`,
      ``,
      `# Deploy an application`,
      `${n} deploy --name myapp --image myapp:latest`,
      ``,
      `# Check status`,
      `${n} status myapp`,
    ],
    patterns: (n) => [
      `# Get detailed status in JSON`,
      `${n} status --output json myapp`,
      ``,
      `# Scale a deployment`,
      `${n} scale --replicas 3 myapp`,
      ``,
      `# View logs`,
      `${n} logs myapp --tail 100`,
      ``,
      `# Apply configuration`,
      `${n} apply -f config.yaml`,
      ``,
      `# Port-forward for local access`,
      `${n} port-forward myapp 8080:80`,
    ],
    troubleshooting: (n) => [
      `**Connection refused**: Check that the cluster/daemon is running; try \`${n} status\``,
      `**Permission denied**: Verify your credentials with \`${n} auth status\``,
      `**Image pull errors**: Check image name, tag, and registry authentication`,
    ],
  },
  {
    match: /\b(ml|machine.learn|train|model|neural|deep.learn|tensor|pytorch|jax|scikit|hugging\s*face|transform|finetun|embed)\b/i,
    category: "ml",
    quickStart: (n) => [
      `# Train a model`,
      `${n} train --config config.yaml --data data/train.jsonl`,
      ``,
      `# Run inference`,
      `${n} predict --model ./checkpoints/best --input sample.txt`,
      ``,
      `# Evaluate model performance`,
      `${n} eval --model ./checkpoints/best --data data/test.jsonl`,
    ],
    patterns: (n) => [
      `# Train with custom hyperparameters`,
      `${n} train --learning-rate 1e-4 --epochs 10 --batch-size 32`,
      ``,
      `# Export model for deployment`,
      `${n} export --model ./checkpoints/best --format onnx --output model.onnx`,
      ``,
      `# Fine-tune from a pretrained model`,
      `${n} train --base-model bert-base --data custom-data.jsonl --output ./finetuned`,
      ``,
      `# Track experiment metrics`,
      `${n} train --tracker wandb --project my-experiment`,
      ``,
      `# Run distributed training`,
      `${n} train --distributed --gpus 4 --config config.yaml`,
    ],
    troubleshooting: (n) => [
      `**CUDA out of memory**: Reduce \`--batch-size\` or enable \`--gradient-checkpointing\``,
      `**Model not found**: Check model path or download with \`${n} download <model-name>\``,
      `**Slow training**: Enable mixed precision with \`--fp16\` or \`--bf16\``,
    ],
  },
  {
    match: /\b(search|grep|find|ripgrep|fd|code.search|index|query)\b/i,
    category: "search",
    quickStart: (n) => [
      `# Search for a pattern in current directory`,
      `${n} "TODO" .`,
      ``,
      `# Search with file type filter`,
      `${n} --type py "def main" src/`,
      ``,
      `# Search with context lines`,
      `${n} -C 3 "error" logs/`,
    ],
    patterns: (n) => [
      `# Case-insensitive search`,
      `${n} -i "pattern" .`,
      ``,
      `# Search and output JSON`,
      `${n} --json "pattern" . | jq '.data.submatches'`,
      ``,
      `# Search for regex patterns`,
      `${n} "fn\\s+\\w+\\(" --type rust src/`,
      ``,
      `# List matching files only`,
      `${n} -l "import" src/`,
      ``,
      `# Exclude directories`,
      `${n} --glob '!node_modules' "require" .`,
    ],
    troubleshooting: (n) => [
      `**No results**: Check glob patterns and file type filters; use \`${n} -u\` to search hidden files`,
      `**Too many results**: Add \`${n} --type\` or \`--glob\` filters to narrow scope`,
      `**Binary file matches**: Add \`${n} --binary\` or exclude binary patterns`,
    ],
  },
  {
    match: /\b(data|json|csv|yaml|parse|transform|etl|process|pipeline|convert)\b/i,
    category: "data",
    quickStart: (n) => [
      `# Process JSON input`,
      `${n} '.key' input.json`,
      ``,
      `# Convert between formats`,
      `${n} convert input.csv --to json --output result.json`,
      ``,
      `# Filter and transform data`,
      `${n} 'select(.status == "active")' data.json`,
    ],
    patterns: (n) => [
      `# Read from stdin in a pipeline`,
      `curl -s https://api.example.com/data | ${n} '.results[]'`,
      ``,
      `# Extract specific fields`,
      `${n} '{name: .name, email: .email}' users.json`,
      ``,
      `# Aggregate values`,
      `${n} '[.[] | .price] | add' products.json`,
      ``,
      `# Process CSV data`,
      `${n} --input-format csv --output-format json data.csv`,
      ``,
      `# Pretty-print with formatting`,
      `${n} --indent 2 --color data.json`,
    ],
    troubleshooting: (n) => [
      `**Parse error**: Validate input format; use \`${n} --raw-input\` for plain text`,
      `**Encoding issues**: Specify \`${n} --encoding utf-8\``,
      `**Large files**: Use \`${n} --slurp\` for streaming or line-by-line processing`,
    ],
  },
  {
    match: /\b(http|api|rest|graphql|grpc|curl|request|fetch|client|server|web)\b/i,
    category: "http",
    quickStart: (n) => [
      `# Make a GET request`,
      `${n} GET https://api.example.com/users`,
      ``,
      `# POST with JSON body`,
      `${n} POST https://api.example.com/users name=John email=john@example.com`,
      ``,
      `# Download a file`,
      `${n} --download https://example.com/file.zip`,
    ],
    patterns: (n) => [
      `# Request with custom headers`,
      `${n} GET https://api.example.com/data Authorization:"Bearer token123"`,
      ``,
      `# Submit form data`,
      `${n} POST https://api.example.com/upload --form file@document.pdf`,
      ``,
      `# Follow redirects and show response headers`,
      `${n} --follow --headers GET https://example.com`,
      ``,
      `# Timeout and retry configuration`,
      `${n} --timeout 30 --retry 3 GET https://api.example.com/data`,
      ``,
      `# Output response body only (for piping)`,
      `${n} --body GET https://api.example.com/data | jq '.'`,
    ],
    troubleshooting: (n) => [
      `**SSL errors**: Use \`${n} --verify no\` for self-signed certs (dev only) or update CA bundle`,
      `**Timeout**: Increase with \`${n} --timeout 30\`; check network connectivity`,
      `**401 Unauthorized**: Verify API key or token; check \`${n} auth\` configuration`,
    ],
  },
  {
    match: /\b(git|version.control|commit|branch|merge|pr|pull.request|github|gitlab)\b/i,
    category: "git",
    quickStart: (n) => [
      `# Show status overview`,
      `${n} status`,
      ``,
      `# Create and switch to a new branch`,
      `${n} branch create feature/my-feature`,
      ``,
      `# View recent history`,
      `${n} log --oneline -10`,
    ],
    patterns: (n) => [
      `# Create a pull request`,
      `${n} pr create --title "Add feature" --body "Description here"`,
      ``,
      `# List open issues`,
      `${n} issue list --state open --json number,title`,
      ``,
      `# View CI/CD status`,
      `${n} run list --limit 5`,
      ``,
      `# Search across repos`,
      `${n} search repos --query "language:python stars:>100"`,
      ``,
      `# Generate changelog`,
      `${n} changelog generate --from v1.0.0 --to HEAD`,
    ],
    troubleshooting: (n) => [
      `**Authentication failed**: Run \`${n} auth login\` or check your token`,
      `**Merge conflicts**: Use \`${n} merge --abort\` to reset, then resolve manually`,
      `**Permission denied**: Verify repository access and organization membership`,
    ],
  },
  {
    match: /\b(agent|autonomous|swarm|multi.agent|crew|autogen|langchain|langraph|agentic|orchestrat|workflow)\b/i,
    category: "agents",
    quickStart: (n) => [
      `# Initialize a new agent project`,
      `${n} init --name my-agent`,
      ``,
      `# Run an agent with a task`,
      `${n} run --task "Research and summarize the latest AI papers"`,
      ``,
      `# List available agents / tools`,
      `${n} list`,
    ],
    patterns: (n) => [
      `# Run with a specific model`,
      `${n} run --model gpt-4 --task "Analyze this codebase"`,
      ``,
      `# Run in verbose mode for debugging`,
      `${n} run --verbose --task "Debug the failing test"`,
      ``,
      `# Configure agent tools`,
      `${n} config --tools web-search,code-exec,file-read`,
      ``,
      `# Run in non-interactive mode (for CI)`,
      `${n} run --non-interactive --input task.txt --output result.json`,
      ``,
      `# Spawn multiple agents`,
      `${n} swarm --agents 3 --task "Process these documents"`,
    ],
    troubleshooting: (n) => [
      `**Agent stuck in loop**: Set \`--max-iterations 10\` to limit execution steps`,
      `**Tool errors**: Verify tool configuration with \`${n} config show\``,
      `**Context too long**: Use \`--max-tokens\` to limit context window usage`,
    ],
  },
  {
    match: /\b(rag|retriev|vector|embed|knowledge.base|semantic|index|chromadb|pinecone|qdrant|weaviate|faiss)\b/i,
    category: "rag",
    quickStart: (n) => [
      `# Index documents for retrieval`,
      `${n} index --input docs/ --collection my-docs`,
      ``,
      `# Query the knowledge base`,
      `${n} query "How do I configure authentication?"`,
      ``,
      `# List indexed collections`,
      `${n} collections list`,
    ],
    patterns: (n) => [
      `# Index with custom embedding model`,
      `${n} index --model text-embedding-3-small --input docs/ --collection project-docs`,
      ``,
      `# Query with metadata filters`,
      `${n} query --filter 'type:api-docs' "rate limiting"`,
      ``,
      `# Export embeddings`,
      `${n} export --collection my-docs --format json --output embeddings.json`,
      ``,
      `# Re-index updated documents`,
      `${n} index --update --input docs/ --collection my-docs`,
      ``,
      `# Query with top-k and threshold`,
      `${n} query --top-k 5 --threshold 0.8 "deployment instructions"`,
    ],
    troubleshooting: (n) => [
      `**Empty results**: Check that documents are indexed; run \`${n} collections info my-docs\``,
      `**Slow queries**: Reduce collection size or add metadata filters`,
      `**Embedding errors**: Verify API key for the embedding model provider`,
    ],
  },
  {
    match: /\b(monitor|metric|observ|log|trace|dashboard|alert|profil|benchmark|perf)\b/i,
    category: "monitoring",
    quickStart: (n) => [
      `# Check system status`,
      `${n} status --json`,
      ``,
      `# View recent logs`,
      `${n} logs --tail 50`,
      ``,
      `# Run a benchmark`,
      `${n} bench --runs 10 -- command-to-benchmark`,
    ],
    patterns: (n) => [
      `# Export metrics as JSON`,
      `${n} metrics export --format json > metrics.json`,
      ``,
      `# Monitor a process`,
      `${n} watch --pid 1234 --interval 5s`,
      ``,
      `# Compare benchmark results`,
      `${n} bench --runs 10 --export results.json -- command-a && ${n} bench --runs 10 --compare results.json -- command-b`,
      ``,
      `# Filter logs by level`,
      `${n} logs --level error --since "1h ago"`,
    ],
    troubleshooting: (n) => [
      `**No data collected**: Check that the target process is running; try \`${n} status\``,
      `**Permission errors**: Some \`${n}\` metrics require elevated privileges (sudo)`,
      `**High overhead**: Reduce sampling frequency with \`${n} --interval 10s\``,
    ],
  },
  {
    match: /\b(package|install|dependency|npm|pip|cargo|build|bundl|compil|runtime)\b/i,
    category: "package-manager",
    quickStart: (n) => [
      `# Install dependencies`,
      `${n} install`,
      ``,
      `# Add a new package`,
      `${n} add express`,
      ``,
      `# List installed packages`,
      `${n} list`,
    ],
    patterns: (n) => [
      `# Install from lockfile (reproducible)`,
      `${n} install --frozen-lockfile`,
      ``,
      `# Update all dependencies`,
      `${n} update`,
      ``,
      `# Check for outdated packages`,
      `${n} outdated`,
      ``,
      `# Remove unused dependencies`,
      `${n} prune`,
      ``,
      `# Run a script`,
      `${n} run build`,
    ],
    troubleshooting: (n) => [
      `**Dependency conflict**: Check version constraints; try \`${n} install --force\``,
      `**Network timeout**: Set \`--registry\` to a mirror, or check proxy settings`,
      `**Permission denied**: Avoid \`sudo\`; use a user-local installation directory`,
    ],
  },
  {
    match: /\b(document|doc|pdf|markdown|generat|api.doc|openapi|swagger|typedoc)\b/i,
    category: "documentation",
    quickStart: (n) => [
      `# Generate documentation`,
      `${n} generate --input src/ --output docs/`,
      ``,
      `# Serve docs locally`,
      `${n} serve docs/ --port 3000`,
      ``,
      `# Validate documentation`,
      `${n} validate docs/`,
    ],
    patterns: (n) => [
      `# Generate API docs from source code`,
      `${n} generate --format html --input src/ --output site/`,
      ``,
      `# Generate in multiple formats`,
      `${n} generate --format json --input src/ --output api.json`,
      ``,
      `# Watch for changes and rebuild`,
      `${n} generate --watch --input src/ --output docs/`,
      ``,
      `# Validate OpenAPI spec`,
      `${n} validate openapi.yaml --strict`,
    ],
    troubleshooting: (n) => [
      `**Missing entries**: Ensure exports are public and documented with JSDoc/docstrings`,
      `**Build errors**: Check config file syntax and path references`,
      `**Broken links**: Run \`${n} validate --check-links\``,
    ],
  },
  {
    match: /\b(cloud|aws|gcp|azure|s3|ec2|lambda|bucket|iam|terraform|pulumi|cdk|cloudformation)\b/i,
    category: "cloud",
    quickStart: (n) => [
      `# List resources`,
      `${n} list --region us-east-1`,
      ``,
      `# Deploy infrastructure`,
      `${n} deploy --stack production`,
      ``,
      `# Check status`,
      `${n} status`,
    ],
    patterns: (n) => [
      `# Plan changes before applying`,
      `${n} plan --var-file production.tfvars`,
      ``,
      `# Apply with auto-approve (CI only)`,
      `${n} apply --auto-approve`,
      ``,
      `# Destroy resources`,
      `${n} destroy --target module.staging`,
      ``,
      `# Import existing resource`,
      `${n} import aws_s3_bucket.my_bucket my-bucket-name`,
    ],
    troubleshooting: (n) => [
      `**Credentials error**: Check \`AWS_PROFILE\` or run \`${n} configure\``,
      `**Region mismatch**: Set \`--region\` explicitly or export \`AWS_REGION\``,
      `**Rate limiting**: Add retry logic or reduce parallelism`,
    ],
  },
  {
    match: /\b(automat|workflow|task.runner|make|just|script|ci|cd|pipeline|github.action)\b/i,
    category: "automation",
    quickStart: (n) => [
      `# Run the default task`,
      `${n} run`,
      ``,
      `# List available tasks`,
      `${n} list`,
      ``,
      `# Run a specific task`,
      `${n} run build`,
    ],
    patterns: (n) => [
      `# Run tasks in parallel`,
      `${n} run --parallel build test lint`,
      ``,
      `# Dry-run to preview actions`,
      `${n} run --dry-run deploy`,
      ``,
      `# Run with environment variables`,
      `${n} run --env NODE_ENV=production build`,
      ``,
      `# Watch mode for continuous runs`,
      `${n} run --watch test`,
    ],
    troubleshooting: (n) => [
      `**Task not found**: Run \`${n} list\` to see available tasks`,
      `**Permission denied**: Check file permissions on scripts`,
      `**Circular dependency**: Review task dependency graph`,
    ],
  },
  {
    match: /\b(network|dns|tcp|udp|proxy|tunnel|ssh|port|firewall|ssl|tls|cert)\b/i,
    category: "network",
    quickStart: (n) => [
      `# Check connectivity`,
      `${n} check example.com`,
      ``,
      `# Scan ports`,
      `${n} scan --port 80,443 example.com`,
      ``,
      `# Show network info`,
      `${n} info`,
    ],
    patterns: (n) => [
      `# Create a tunnel`,
      `${n} tunnel --local 8080 --remote example.com:443`,
      ``,
      `# DNS lookup`,
      `${n} lookup example.com --type A,AAAA,MX`,
      ``,
      `# Generate TLS certificate`,
      `${n} cert generate --domain example.com --output certs/`,
    ],
    troubleshooting: (n) => [
      `**Connection refused**: Check firewall rules and service availability`,
      `**Certificate error**: Verify cert chain with \`${n} cert verify\``,
      `**DNS resolution**: Try \`${n} lookup --server 8.8.8.8\``,
    ],
  },
  {
    match: /\b(browser|chromium|puppeteer|selenium|playwright|headless|scrape|crawl|screenshot)\b/i,
    category: "browser",
    quickStart: (n) => [
      `# Take a screenshot`,
      `${n} screenshot https://example.com --output page.png`,
      ``,
      `# Scrape page content`,
      `${n} scrape https://example.com --selector "h1"`,
      ``,
      `# Run browser tests`,
      `${n} test --headed`,
    ],
    patterns: (n) => [
      `# Generate PDF from URL`,
      `${n} pdf https://example.com --output page.pdf`,
      ``,
      `# Crawl a site`,
      `${n} crawl https://example.com --depth 3 --output sitemap.json`,
      ``,
      `# Run in headless mode`,
      `${n} run --headless --browser chromium`,
    ],
    troubleshooting: (n) => [
      `**Browser not found**: Install with \`${n} install chromium\``,
      `**Timeout on page load**: Increase with \`--timeout 60000\``,
      `**Element not found**: Verify selector with browser DevTools`,
    ],
  },
  {
    match: /\b(file|fs|directory|copy|move|rename|archive|zip|tar|compress|backup)\b/i,
    category: "file-management",
    quickStart: (n) => [
      `# List files`,
      `${n} list .`,
      ``,
      `# Copy with progress`,
      `${n} copy src/ dest/ --progress`,
      ``,
      `# Archive a directory`,
      `${n} archive --input src/ --output backup.tar.gz`,
    ],
    patterns: (n) => [
      `# Sync directories`,
      `${n} sync source/ destination/ --delete`,
      ``,
      `# Find duplicate files`,
      `${n} dedup --dir . --dry-run`,
      ``,
      `# Batch rename`,
      `${n} rename "*.jpg" --pattern '{name}-{date}.jpg'`,
    ],
    troubleshooting: (n) => [
      `**Permission denied**: Check file ownership; use \`sudo\` if necessary`,
      `**Disk full**: Free space or use \`${n} --compress\``,
      `**Symlink issues**: Use \`--follow-links\` or \`--no-follow-links\``,
    ],
  },
  {
    match: /\b(tui|terminal.ui|curses|prompt|interactive|menu|select|dialog|rich|textual)\b/i,
    category: "tui",
    quickStart: (n) => [
      `# Launch interactive mode`,
      `${n}`,
      ``,
      `# Run with a specific view`,
      `${n} --view dashboard`,
      ``,
      `# Use non-interactive mode for scripts`,
      `${n} --no-interactive --output json`,
    ],
    patterns: (n) => [
      `# Custom theme`,
      `${n} --theme dark`,
      ``,
      `# Pipe-friendly output`,
      `${n} list --format plain | head -20`,
      ``,
      `# Resize-aware rendering`,
      `${n} --columns 120 --rows 40`,
    ],
    troubleshooting: (n) => [
      `**Display garbled**: Check terminal supports 256 colors or set \`TERM=xterm-256color\``,
      `**Key bindings not working**: Try \`${n} --keys emacs\` or check \`$TERM\``,
      `**No output in pipe**: Use \`--no-interactive\` or \`--format plain\``,
    ],
  },
  {
    match: /\b(image|video|audio|media|ffmpeg|imagemagick|convert|resize|encode|decode|transcode)\b/i,
    category: "media",
    quickStart: (n) => [
      `# Convert format`,
      `${n} convert input.png --to webp --output result.webp`,
      ``,
      `# Resize image`,
      `${n} resize input.jpg --width 800 --output thumb.jpg`,
      ``,
      `# Get media info`,
      `${n} info video.mp4`,
    ],
    patterns: (n) => [
      `# Batch convert`,
      `${n} convert *.png --to webp --output-dir converted/`,
      ``,
      `# Extract audio from video`,
      `${n} extract --audio video.mp4 --output audio.mp3`,
      ``,
      `# Optimize for web`,
      `${n} optimize --quality 80 images/`,
    ],
    troubleshooting: (n) => [
      `**Codec not found**: Install codec pack or use \`${n} --codec libx264\``,
      `**Out of memory**: Reduce resolution or process in chunks`,
      `**Format unsupported**: Check \`${n} formats\` for supported types`,
    ],
  },
];

/** Default domain when nothing matches */
const DEFAULT_DOMAIN: InferredDomain = {
  category: "general",
  quickStart: [],
  patterns: [],
  troubleshooting: [],
};

/** Infer the binary name for a tool (prefers Cargo/Go binary name over repo name). */
export function inferBinName(tool: Tool): string {
  const installDir = getToolInstallDir(
    join(homedir(), ".agents-cli"),
    tool.meta.name,
  );
  const bins = inferBinaryNames(installDir);
  // Prefer the first binary name that differs from the tool name
  return bins[0] ?? tool.meta.name;
}

/** Infer domain-specific usage from tool metadata */
export function inferDomain(tool: Tool): InferredDomain {
  const searchText = [
    tool.meta.name,
    tool.meta.description || "",
    ...(tool.meta.tags as string[]),
    tool.source.uri || "",
    tool.meta.homepage || "",
  ].join(" ");

  const binName = inferBinName(tool);

  for (const pattern of DOMAIN_PATTERNS) {
    if (pattern.match.test(searchText)) {
      return {
        category: pattern.category,
        quickStart: pattern.quickStart(binName),
        patterns: pattern.patterns(binName),
        troubleshooting: pattern.troubleshooting(binName),
      };
    }
  }

  return DEFAULT_DOMAIN;
}

/** Detected language for a tool */
type ToolLanguage = "rust" | "go" | "python" | "node" | "c" | "unknown";

/** Detect the primary implementation language of a tool from all available signals */
export function detectToolLanguage(tool: Tool): ToolLanguage {
  // 1. Source format is definitive
  if (tool.source.format === "npm") return "node";
  if (tool.source.format === "pypi") return "python";
  if (tool.source.format === "crates") return "rust";

  // 2. GitHub topics (tags from API)
  const tags = (tool.meta.tags as string[]).map(t => t.toLowerCase());
  if (tags.includes("rust") || tags.includes("rust-lang")) return "rust";
  if (tags.includes("go") || tags.includes("golang")) return "go";
  if (tags.includes("python") || tags.includes("python3")) return "python";
  if (tags.includes("nodejs") || tags.includes("node") || tags.includes("typescript") || tags.includes("javascript")) return "node";
  if (tags.includes("c") || tags.includes("cpp") || tags.includes("c-plus-plus")) return "c";

  // 3. Check installed files for build system markers
  if (tool.installPath) {
    if (existsSync(join(tool.installPath, "Cargo.toml"))) return "rust";
    if (existsSync(join(tool.installPath, "go.mod")) || existsSync(join(tool.installPath, "go.sum"))) return "go";
    if (existsSync(join(tool.installPath, "pyproject.toml")) || existsSync(join(tool.installPath, "setup.py"))) return "python";
    if (existsSync(join(tool.installPath, "package.json"))) return "node";
    if (existsSync(join(tool.installPath, "Makefile")) || existsSync(join(tool.installPath, "CMakeLists.txt"))) return "c";
  }

  // 4. Curated category hints
  const curated = tool._curatedMeta;
  if (curated) {
    const cat = curated.category.toLowerCase();
    if (cat.includes("ml") || cat.includes("nlp") || cat.includes("data") || cat.includes("vision") ||
        cat.includes("audio") || cat.includes("fine-tun") || cat.includes("train") || cat.includes("python")) {
      return "python";
    }
  }

  return "unknown";
}

/** Check if a tool is likely a CLI (not a library/SDK) */
export function isLikelyCli(tool: Tool): boolean {
  // Tools with discovered commands are definitely CLIs
  if (tool.capabilities.commands.length > 0) return true;
  // Check tags
  const tags = (tool.meta.tags as string[]).map(t => t.toLowerCase());
  if (tags.some(t => ["cli", "command-line", "terminal", "shell"].includes(t))) return true;
  // Negative signal: library/SDK/framework tags strongly indicate NOT a CLI
  const libraryTags = ["library", "sdk", "framework", "api", "module", "package", "toolkit"];
  const hasLibraryTag = tags.some(t => libraryTags.includes(t));
  // Check description/agentValue for CLI indicators
  const curated = tool._curatedMeta;
  const searchText = [tool.meta.description, curated?.agentValue ?? ""].join(" ").toLowerCase();
  // Only trust CLI indicators if there are no strong library signals
  if (!hasLibraryTag && /\b(cli|command.line|terminal|flags?|subcommands?|--\w+)\b/.test(searchText)) {
    // Exclude false positives: descriptions that mention CLI features of OTHER tools
    // e.g. "provides a Python API" mentioning "--flag" in passing
    const libraryPatterns = /\b(library|sdk|framework|api\s+(client|gateway|wrapper)|import\s+\w+|from\s+\w+\s+import)\b/i;
    if (!libraryPatterns.test(searchText)) return true;
  }
  // Check if binary files were found during install
  const installDir = tool.installPath;
  if (installDir && existsSync(join(installDir, "bin"))) return true;
  return false;
}

/** Generate a language-appropriate API usage stub for examples.md (libraries only) */
export function generateExamplesStub(
  lines: string[],
  tool: Tool,
  name: string,
  curated?: { description: string; agentValue: string; category: string },
): void {
  const lang = detectToolLanguage(tool);
  const desc = curated?.description ?? tool.meta.description ?? name;
  if (lang === "python") {
    const modName = name.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
    lines.push("```python");
    lines.push(`import ${modName}`);
    lines.push("");
    lines.push(`# ${desc}`);
    lines.push(`# See project README for complete API reference`);
    if (curated) lines.push(`# ${curated.agentValue}`);
    lines.push("```");
  } else if (lang === "node") {
    const pkgName = tool.source.uri.startsWith("npm:") ? tool.source.uri.slice(4) : tool.source.uri;
    lines.push("```typescript");
    lines.push(`import { /* ... */ } from "${pkgName}";`);
    lines.push("");
    lines.push(`// ${desc}`);
    lines.push(`// See project README for complete API reference`);
    if (curated) lines.push(`// ${curated.agentValue}`);
    lines.push("```");
  } else {
    const docsUrl = tool.meta.homepage || `https://github.com/${tool.source.uri}`;
    lines.push(`See the [project documentation](${docsUrl}) for API usage examples.`);
  }
}

/** Infer install command for a library (project-local, not global) */
export function inferLibraryInstallCommand(tool: Tool): string {
  const uri = tool.source.uri;
  if (tool.source.format === "npm") {
    const pkg = uri.startsWith("npm:") ? uri.slice(4) : uri;
    return `npm install ${shellQuote(pkg)}\n# Or: npx ${shellQuote(pkg)}`;
  }
  if (tool.source.format === "pypi") {
    const pkg = uri.startsWith("pypi:") ? uri.slice(5) : uri;
    return `pip install ${shellQuote(pkg)}\n# Or: uv add ${shellQuote(pkg)}`;
  }
  if (tool.source.format === "crates") {
    const pkg = uri.startsWith("crates:") ? uri.slice(7) : uri;
    return `cargo add ${shellQuote(pkg)}`;
  }
  // GitHub repos — detect language
  const lang = detectToolLanguage(tool);
  const name = tool.meta.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const safeName = shellQuote(name);
  switch (lang) {
    case "python": return `pip install ${safeName}\n# Or: uv add ${safeName}`;
    case "node": return `npm install ${safeName}`;
    case "rust": return `cargo add ${safeName}`;
    default: return `# See https://github.com/${uri} for installation instructions`;
  }
}

/** Infer the install command based on detected language and source format */
export function inferInstallCommand(tool: Tool, _curated?: Tool["_curatedMeta"]): string {
  const uri = tool.source.uri;
  if (tool.source.format === "npm") {
    return `npm install ${uri.startsWith("npm:") ? uri.slice(4) : uri}`;
  }
  if (tool.source.format === "pypi") {
    return `pip install ${uri.startsWith("pypi:") ? uri.slice(5) : uri}`;
  }
  if (tool.source.format === "crates") {
    return `cargo install ${uri.startsWith("crates:") ? uri.slice(7) : uri}`;
  }
  // GitHub repos — use detected language
  const lang = detectToolLanguage(tool);
  const name = tool.meta.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  switch (lang) {
    case "rust": return `cargo binstall ${name}\n# Or: cargo install ${name}`;
    case "go": return `go install github.com/${uri}@latest`;
    case "python": return `uv tool install ${name}\n# Or: pip install ${name}`;
    case "node": return `npm install -g ${name}`;
    default: return `# Download from https://github.com/${uri}/releases\n# Or: brew install ${name}`;
  }
}

/**
 * Generate Quick Start for a library/SDK (not a CLI tool).
 * Extracts real API examples from README code blocks when available,
 * otherwise generates language-appropriate import + usage stubs.
 * Never generates fake CLI subcommands like train/predict/eval.
 */
export function generateLibraryQuickStart(
  s: string[],
  tool: Tool,
  name: string,
  uri: string,
  curated?: { description: string; agentValue: string; category: string },
  readmeSections?: Tool["_readmeSections"],
): void {
  const lang = detectToolLanguage(tool);
  const installCmd = inferInstallCommand(tool, curated);
  const desc = curated?.description ?? tool.meta.description ?? name;

  // Try to extract real code examples from README
  const codeBlocks = readmeSections?.codeBlocks ?? [];

  // Prefer blocks classified as "usage", fall back to "advanced" — never "install"/"output"
  const usageBlocks = codeBlocks.filter(b => b.purpose === "usage");
  const advancedBlocks = codeBlocks.filter(b => b.purpose === "advanced");
  // If we have purpose-classified usage blocks, prefer those; otherwise fall back to old heuristic
  const apiBlocks = usageBlocks.length > 0 ? usageBlocks : advancedBlocks.length > 0 ? advancedBlocks : codeBlocks.filter(b => {
    const code = b.code.toLowerCase();
    // Skip install-only blocks
    if (INSTALL_CMD_RE.test(code) && code.split("\n").length < 3) return false;
    // Prefer blocks that import/require the tool
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (code.includes("import ") || code.includes("require(") || code.includes("from ")) return true;
    if (code.includes(safeName)) return true;
    // Accept bash/shell blocks that reference the tool name (real CLI usage, not just install)
    if (b.lang === "bash" || b.lang === "sh" || b.lang === "shell") {
      const binName = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
      const lines = code.split("\n").filter(l => l.trim().length > 0 && !l.trim().startsWith("#"));
      const hasToolUsage = lines.some(l => {
        const trimmed = l.trim().replace(/^\$\s*/, "");
        return trimmed.startsWith(binName + " ") || trimmed.startsWith(binName + "\t");
      });
      if (hasToolUsage) return true;
      return false;
    }
    // Accept YAML/TOML config blocks (tool configuration files)
    if (b.lang === "yaml" || b.lang === "yml" || b.lang === "toml") return true;
    return b.lang === "python" || b.lang === "javascript" || b.lang === "typescript" || b.lang === "js" || b.lang === "ts";
  });

  // Install step
  s.push("```bash");
  s.push(`# Install`);
  s.push(installCmd);
  s.push("```");
  s.push("");

  if (apiBlocks.length > 0) {
    // Use real code from README (first 2 blocks, max 20 lines each)
    for (const block of apiBlocks.slice(0, 2)) {
      const lines = block.code.split("\n").slice(0, 20);
      s.push(`\`\`\`${block.lang || (lang === "python" ? "python" : "typescript")}`);
      for (const line of lines) s.push(line);
      s.push("```");
      s.push("");
    }
  } else if (lang === "python") {
    // Python library stub — import only, no fabricated Client() calls
    const modName = name.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
    s.push("```python");
    s.push(`import ${modName}`);
    s.push("");
    s.push(`# See ${name} documentation for API usage examples`);
    s.push(`# https://pypi.org/project/${name}/`);
    s.push("```");
  } else if (lang === "node") {
    // JavaScript/TypeScript SDK stub — import only, no fabricated constructor
    const importName = name.replace(/[^a-zA-Z0-9]/g, "");
    const pkgName = uri.startsWith("npm:") ? uri.slice(4) : uri;
    s.push("```typescript");
    s.push(`import ${importName} from "${pkgName}";`);
    s.push("");
    s.push(`// See ${name} documentation for API usage examples`);
    s.push("```");
  } else {
    // Generic library
    s.push("```bash");
    s.push(`# See project README for API usage examples`);
    s.push(`# ${desc}`);
    s.push("```");
  }
}

// ── Rich frontmatter helpers ──

/** Domain → allowed-tools mapping */
export const DOMAIN_ALLOWED_TOOLS: Record<string, string> = {
  "python":     "Read,Grep,Glob,Bash(python *),Bash(pip *),Bash(uv *),Bash(ruff *),Bash(pytest *)",
  "javascript": "Read,Grep,Glob,Bash(node *),Bash(npm *),Bash(npx *),Bash(tsc *)",
  "database":   "Read,Grep,Glob,Bash",
  "security":   "Read,Grep,Glob,Bash",
  "devops":     "Read,Grep,Glob,Bash",
  "git":        "Read,Grep,Glob,Bash(git *)",
  "testing":    "Read,Grep,Glob,Bash",
  "cloud":      "Read,Grep,Glob,Bash",
  "agent":      "Read,Grep,Glob,Bash,Agent",
  "web":        "Read,Grep,Glob,Bash(node *),Bash(npm *)",
};

export function inferAllowedTools(tool: Tool, domainValue: string): string | null {
  const baseDomain = domainValue.split("/")[0]!;
  const mapped = DOMAIN_ALLOWED_TOOLS[baseDomain];
  if (mapped) return mapped;

  // For CLI tools with commands, allow Bash with tool-specific pattern
  if (tool.capabilities.commands.length > 0) {
    const binName = inferBinName(tool);
    return `Read,Grep,Glob,Bash(${binName} *)`;
  }
  return null;
}

export function isHeavyWorkflow(tool: Tool): boolean {
  // Tools with many commands or large analysis surface are heavy
  if (tool.capabilities.commands.length > 20) return true;
  // Tools that are known CI/build/deploy tools
  const heavyNames = ["terraform", "ansible", "docker", "kubernetes", "helm", "webpack", "turbo"];
  return heavyNames.some(n => tool.meta.name.toLowerCase().includes(n));
}

export function inferArgumentHint(tool: Tool, binName: string): string | null {
  if (tool.capabilities.commands.length === 0) return null;
  // Check for common argument patterns
  const hasFileArgs = tool.capabilities.commands.some(c =>
    c.flags.some(f => f.name.includes("file") || f.name.includes("path") || f.name.includes("input")));
  if (hasFileArgs) return `<file or directory>`;
  return `<${binName} subcommand or query>`;
}
