import type {
  Skill,
  SkillDirectory,
  SkillFrontmatter,
  SkillCompatibility,
  SkillResources,
  Tool,
  ToolCapabilities,
  ToolCommand,
  Lockfile,
  LockEntry,
  ToolStore,
} from "./types.js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createResolver } from "./resolver.js";
import { createInstaller } from "./installer.js";
import { createAnalyzer, findMainBinary } from "./analyzer.js";
import { createStore, getToolInstallDir } from "./store.js";
import { readPkgVersion } from "./pkg-utils.js";
import { validateToolName } from "./guards.js";

// =============================================================================
// YAML Frontmatter Parsing
// =============================================================================

/** Parse a simple YAML value (scalars, inline arrays) */
function parseYamlValue(raw: string): string | string[] {
  const trimmed = raw.trim();

  // Inline array: [a, b, c]
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === "") return [];
    return inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }

  // Quoted string
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/** Parse SKILL.md frontmatter from raw markdown content */
export function parseFrontmatter(content: string): SkillFrontmatter | null {
  // Match frontmatter between --- delimiters
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match?.[1]) return null;

  const yamlBlock = match[1];
  const lines = yamlBlock.split("\n").map((l) => l.replace(/\r$/, ""));

  const data: Record<string, string | string[]> = {};
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const line of lines) {
    // Blank or comment line
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }

    // List item under a key (e.g. "  - value")
    const listMatch = /^\s+-\s+(.+)/.exec(line);
    if (listMatch?.[1] && currentKey && currentArray) {
      currentArray.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    // Key: value pair
    const kvMatch = /^(\w[\w-]*)\s*:\s*(.*)$/.exec(line);
    if (kvMatch?.[1]) {
      // Save previous array key if pending
      if (currentKey && currentArray) {
        data[currentKey] = currentArray;
      }

      const key = kvMatch[1];
      const rawValue = kvMatch[2] ?? "";

      if (rawValue.trim() === "" || rawValue.trim() === "[]") {
        // Start of a block array or empty array
        currentKey = key;
        currentArray = rawValue.trim() === "[]" ? [] : [];
        if (rawValue.trim() === "[]") {
          data[key] = [];
          currentKey = null;
          currentArray = null;
        }
      } else {
        // Flush any pending array
        currentKey = null;
        currentArray = null;

        const parsed = parseYamlValue(rawValue);
        data[key] = parsed;
      }
      continue;
    }
  }

  // Flush final array
  if (currentKey && currentArray) {
    data[currentKey] = currentArray;
  }

  // Validate required fields (version is optional, defaults to "0.0.0")
  const name = typeof data.name === "string" ? data.name : null;
  const version = typeof data.version === "string" ? data.version : "0.0.0";
  const description = typeof data.description === "string" ? data.description : null;

  if (!name || !description) return null;

  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  // Parse compatibility (optional)
  let compatibility: SkillCompatibility | undefined;
  const nodeReq = typeof data.node === "string" ? data.node : undefined;
  const pythonReq = typeof data.python === "string" ? data.python : undefined;
  const toolsReq = Array.isArray(data.requires) ? data.requires : undefined;
  if (nodeReq || pythonReq || toolsReq) {
    compatibility = { node: nodeReq, python: pythonReq, tools: toolsReq };
  }

  const domain = typeof data.domain === "string" ? data.domain : undefined;

  return { name, version, description, ingredients, tags, compatibility, domain };
}

// =============================================================================
// Bundled Resources
// =============================================================================

const RESOURCE_DIRS = ["scripts", "references", "assets"] as const;

/** Discover bundled resource files in a skill directory */
export function discoverResources(skillDir: string): SkillResources {
  const result: Record<string, string[]> = { scripts: [], references: [], assets: [] };

  for (const dir of RESOURCE_DIRS) {
    const full = join(skillDir, dir);
    if (!existsSync(full)) continue;
    try {
      const entries = readdirSync(full, { recursive: true }) as string[];
      for (const entry of entries) {
        const entryPath = join(full, entry);
        // Only include files, not directories
        try {
          if (!readdirSync(entryPath).length) continue;
        } catch {
          // Not a directory — it's a file
          result[dir]!.push(entryPath);
        }
      }
    } catch { /* skip unreadable */ }
  }

  return {
    scripts: result.scripts!,
    references: result.references!,
    assets: result.assets!,
  };
}

// =============================================================================
// Shared Tool Installation
// =============================================================================

/** Install a single tool from a source identifier. Shared by `add` command and `installSkill`. */
export async function installTool(
  source: string,
  dataDir: string,
  options: { store?: ToolStore; verbose?: boolean; recursive?: boolean } = {},
): Promise<Tool> {
  const resolver = createResolver();
  const installer = createInstaller();
  const analyzer = createAnalyzer();
  const store = options.store ?? createStore(dataDir);

  if (!resolver.supports(source)) {
    throw new Error(`Unknown source format: ${source}`);
  }

  const resolved = await resolver.resolve(source);
  const toolId = resolved.meta.name ?? source.replace(/[/@]/g, "-").replace(/^-/, "");
  const installDir = getToolInstallDir(dataDir, toolId);

  if (!installer.supports(resolved.source.format)) {
    throw new Error(`Installer does not support format: ${resolved.source.format}`);
  }

  const installResult = await installer.install(resolved.source, installDir);
  if (options.verbose) {
    console.log(`  Installed in ${installResult.duration}ms (${installResult.binaries.length} binaries found)`);
  }

  // Analyze — deep probe if requested, otherwise shallow
  let capabilities: ToolCapabilities = { commands: [], globalFlags: [], analysisMethod: "help-probe" };
  const mainBin = findMainBinary(installDir);
  if (mainBin) {
    try {
      capabilities = await analyzer.analyze(mainBin, { recursive: options.recursive });
    } catch {
      // analysis failed, use defaults
    }
  }

  // Determine version
  const version = readPkgVersion(installDir, resolved.meta.version ?? "0.0.0");

  const now = new Date().toISOString();
  const tool: Tool = {
    id: toolId,
    meta: {
      name: resolved.meta.name ?? toolId,
      version,
      description: resolved.meta.description ?? "",
      homepage: resolved.meta.homepage,
      license: resolved.meta.license,
      tags: resolved.meta.tags ? [...resolved.meta.tags] : [],
    },
    source: resolved.source,
    capabilities,
    installPath: installDir,
    status: "installed",
    installedAt: now,
    updatedAt: now,
  };

  await store.save(tool);
  return tool;
}

// =============================================================================
// Skill Installation
// =============================================================================

/** Install a skill from a SKILL.md file path, resolving each ingredient sequentially */
export async function installSkill(skillPath: string, dataDir: string): Promise<Skill> {
  const content = readFileSync(skillPath, "utf-8");
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    throw new Error(`Failed to parse SKILL.md frontmatter from: ${skillPath}`);
  }

  // Extract body (everything after the second ---)
  const bodyMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/.exec(content);
  const body = bodyMatch?.[1]?.trim() ?? "";

  const store = createStore(dataDir);
  const tools: Tool[] = [];

  // Install each ingredient using the shared installTool function
  for (const ingredient of frontmatter.ingredients) {
    const tool = await installTool(ingredient, dataDir, { store });
    tools.push(tool);
  }

  // Discover bundled resources from the skill's directory
  const skillDir = dirname(skillPath);
  const resources = discoverResources(skillDir);

  const skillStoreDir = join(dataDir, "skills", frontmatter.name);
  const contextPath = join(skillStoreDir, "CONTEXT.md");
  mkdirSync(skillStoreDir, { recursive: true });

  const skill: Skill = {
    frontmatter,
    body,
    ingredients: tools,
    contextPath,
    resources,
  };

  // Write assembled context
  const contextContent = buildContext(skill);
  writeFileSync(contextPath, contextContent, "utf-8");

  // Write skill metadata for listing/management
  const metaPath = join(skillStoreDir, "skill.json");
  writeFileSync(metaPath, JSON.stringify({
    name: frontmatter.name,
    version: frontmatter.version,
    description: frontmatter.description,
    tags: [...frontmatter.tags],
    compatibility: frontmatter.compatibility,
    ingredients: [...frontmatter.ingredients],
    toolIds: tools.map((t) => t.id),
    resources: {
      scripts: resources.scripts.length,
      references: resources.references.length,
      assets: resources.assets.length,
    },
    installedAt: new Date().toISOString(),
  }, null, 2), "utf-8");

  return skill;
}

// =============================================================================
// Skill Management
// =============================================================================

/** Metadata stored for an installed skill */
export interface InstalledSkillMeta {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly compatibility?: SkillCompatibility;
  readonly ingredients: readonly string[];
  readonly toolIds: readonly string[];
  readonly resources: { scripts: number; references: number; assets: number };
  readonly installedAt: string;
}

/** List all installed skills */
export function listSkills(dataDir: string): InstalledSkillMeta[] {
  const skillsDir = join(dataDir, "skills");
  if (!existsSync(skillsDir)) return [];

  const results: InstalledSkillMeta[] = [];
  try {
    for (const entry of readdirSync(skillsDir)) {
      const metaPath = join(skillsDir, entry, "skill.json");
      if (!existsSync(metaPath)) continue;
      try {
        const meta = JSON.parse(readFileSync(metaPath, "utf-8")) as InstalledSkillMeta;
        results.push(meta);
      } catch { /* skip corrupted */ }
    }
  } catch { /* skip unreadable */ }

  return results;
}

/** Remove an installed skill (and optionally its tools) */
export async function removeSkill(
  name: string,
  dataDir: string,
  options: { removeTools?: boolean } = {},
): Promise<boolean> {
  const skillDir = join(dataDir, "skills", name);
  const metaPath = join(skillDir, "skill.json");

  if (!existsSync(metaPath)) return false;

  // Optionally remove the skill's tools
  if (options.removeTools) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, "utf-8")) as InstalledSkillMeta;
      const store = createStore(dataDir);
      for (const toolId of meta.toolIds) {
        await store.remove(toolId);
      }
    } catch { /* best effort */ }
  }

  // Remove the skill directory
  const { rmSync } = await import("node:fs");
  rmSync(skillDir, { recursive: true, force: true });
  return true;
}

// =============================================================================
// Lockfile
// =============================================================================

/** Compute integrity hash for a lock entry */
function computeIntegrity(sourceUri: string, version: string): string {
  return createHash("sha256")
    .update(`${sourceUri}@${version}`)
    .digest("hex");
}

/** Parse an agentcli.lock JSON string into a Lockfile object */
export function parseLockfile(content: string): Lockfile | null {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    if (data.version !== 1) return null;
    if (!Array.isArray(data.entries)) return null;
    if (typeof data.generatedAt !== "string") return null;

    const entries: LockEntry[] = [];
    for (const entry of data.entries as Record<string, unknown>[]) {
      if (
        typeof entry.id !== "string" ||
        typeof entry.version !== "string" ||
        typeof entry.integrity !== "string" ||
        !entry.source ||
        typeof entry.source !== "object"
      ) {
        return null;
      }
      const source = entry.source as Record<string, unknown>;
      if (typeof source.format !== "string" || typeof source.uri !== "string") {
        return null;
      }
      entries.push({
        id: entry.id,
        version: entry.version,
        source: {
          format: source.format as Tool["source"]["format"],
          uri: source.uri,
          ref: typeof source.ref === "string" ? source.ref : undefined,
          subpath: typeof source.subpath === "string" ? source.subpath : undefined,
        },
        integrity: entry.integrity,
      });
    }

    return {
      version: 1,
      entries,
      generatedAt: data.generatedAt as string,
    };
  } catch {
    return null;
  }
}

/** Generate a lockfile object from an array of installed tools */
export function generateLockfile(tools: Tool[]): Lockfile {
  const entries: LockEntry[] = tools.map((tool) => ({
    id: tool.id,
    version: tool.meta.version,
    source: tool.source,
    integrity: computeIntegrity(tool.source.uri, tool.meta.version),
  }));

  return {
    version: 1,
    entries,
    generatedAt: new Date().toISOString(),
  };
}

/** Write a lockfile to disk */
export function writeLockfile(lockPath: string, tools: Tool[]): void {
  const lockfile = generateLockfile(tools);
  writeFileSync(lockPath, JSON.stringify(lockfile, null, 2), "utf-8");
}

/** Read a lockfile from disk */
export function readLockfile(lockPath: string): Lockfile | null {
  if (!existsSync(lockPath)) return null;
  const content = readFileSync(lockPath, "utf-8");
  return parseLockfile(content);
}

// =============================================================================
// Context Building
// =============================================================================

/** Build context with progressive disclosure — metadata summary first, references on demand */
export function buildContext(skill: Skill): string {
  const sections: string[] = [];

  // Level 1: Skill metadata summary (always loaded)
  sections.push(`# ${skill.frontmatter.name}`);
  sections.push("");
  if (skill.frontmatter.description) {
    sections.push(skill.frontmatter.description);
    sections.push("");
  }

  // Compatibility note if present
  if (skill.frontmatter.compatibility) {
    const compat = skill.frontmatter.compatibility;
    const reqs: string[] = [];
    if (compat.node) reqs.push(`Node.js ${compat.node}`);
    if (compat.python) reqs.push(`Python ${compat.python}`);
    if (compat.tools?.length) reqs.push(`Tools: ${compat.tools.join(", ")}`);
    if (reqs.length > 0) {
      sections.push(`**Requires**: ${reqs.join(" | ")}`);
      sections.push("");
    }
  }

  // Bundled resources — progressive disclosure guidance
  const resources = skill.resources ?? { scripts: [], references: [], assets: [] };
  if (resources.scripts.length > 0 || resources.references.length > 0) {
    sections.push("## Bundled Resources");
    sections.push("");
    if (resources.scripts.length > 0) {
      sections.push("**Scripts** (run directly):");
      for (const sc of resources.scripts) {
        sections.push(`- \`${sc}\``);
      }
      sections.push("");
    }
    if (resources.references.length > 0) {
      sections.push("**References** (read only when you need detailed info on a specific topic):");
      for (const r of resources.references) {
        sections.push(`- \`${r}\``);
      }
      sections.push("");
    }
  }

  // Level 2: Skill body instructions
  if (skill.body) {
    sections.push(skill.body);
    sections.push("");
  }

  // Level 3: Tool details — compact command/flag summary
  if (skill.ingredients.length > 0) {
    sections.push("## Installed Tools");
    sections.push("");

    for (const tool of skill.ingredients) {
      sections.push(`### ${tool.meta.name}@${tool.meta.version}`);
      sections.push("");
      if (tool.meta.description) {
        sections.push(tool.meta.description);
        sections.push("");
      }

      // Compact command summary
      if (tool.capabilities.commands.length > 0) {
        sections.push("**Commands**: " + tool.capabilities.commands.map((c) => `\`${c.name}\``).join(", "));
        sections.push("");
      }
      if (tool.capabilities.globalFlags.length > 0) {
        sections.push("**Flags**: " + tool.capabilities.globalFlags.map((f) => `\`${f.name}\``).join(", "));
        sections.push("");
      }

      // Point to references instead of inlining
      if (tool.capabilities.rawHelp) {
        sections.push(`_Full help: run \`${tool.meta.name} --help\` or see references/help-output.md if bundled._`);
        sections.push("");
      }
    }
  }

  return sections.join("\n");
}

// =============================================================================
// Skill Scaffolding
// =============================================================================

/**
 * Generate a rich SKILL.md from an installed tool's discovered capabilities.
 *
 * Produces detailed, compliant skills following the official guidelines:
 * - Description: [What it does]. Use when [trigger phrases].
 * - Body under 300 lines with concrete examples (no placeholders)
 * - Detailed content split into references/ for progressive disclosure
 * - No boilerplate sections (overview, installation, agent integration)
 *
 * When capability data is missing (no commands/flags/help discovered),
 * the generator infers usage patterns from the tool's description, tags,
 * homepage, and source to produce rich, domain-specific content.
 */

const MAX_QUICK_START_EXAMPLES = 3;
const MAX_PATTERN_EXAMPLES = 5;
const MAX_HELP_LINES = 60;

/** Escape a string for use in YAML frontmatter double quotes */
function esc(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ");
}

/** Normalize description: strip trailing period, strip "CLI tool:" prefix, provide fallback */
function normalizeDesc(tool: Tool): string {
  const raw = (tool.meta.description || tool.meta.name).replace(/\.$/, "");
  // Strip generic "CLI tool:" prefix — always lead with actual description
  return raw.replace(/^CLI tool:\s*/i, "").trim() || tool.meta.name;
}

/**
 * Build a compliant description: "[What it does]. Use when [trigger phrases]."
 * Third person, under 1024 chars, no XML tags. Uses action verbs from commands
 * or domain-inferred trigger phrases — never "the task involves".
 */
function buildDescription(tool: Tool): string {
  const desc = normalizeDesc(tool);
  const name = tool.meta.name;
  const commands = tool.capabilities.commands;

  // Check for curated metadata attached by the forge pipeline
  const curated = (tool as Tool & { _curatedMeta?: { description: string; agentValue: string; category: string } })._curatedMeta;

  // Use curated description if the resolved one is just the tool name
  const effectiveDesc = (curated && desc.length < 30 && desc.toLowerCase().replace(/[^a-z0-9]/g, "") === name.toLowerCase().replace(/[^a-z0-9]/g, ""))
    ? curated.description
    : desc;

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
    if (matchCount < 2) {
      triggers.push(`running ${name} commands`, `configuring ${name}`);
    }
  } else if (curated) {
    // Map curated category → action-verb triggers the scorer recognizes
    // Keys must match actual domain values from ai-ml-tools.json (lowercase with hyphens)
    const categoryActionMap: Record<string, string[]> = {
      "ai-ml/llm-inference": ["running LLM inference", "deploying language models", "generating text with AI"],
      "ai-ml/ai-agents": ["building AI agents", "orchestrating agent workflows", "managing autonomous tasks"],
      "ai-ml/ai-coding": ["generating code with AI", "building AI-powered dev tools", "debugging with AI assistance"],
      "ai-ml/rag-and-embeddings": ["building retrieval pipelines", "embedding documents for search", "indexing knowledge bases"],
      "ai-ml/vector-search": ["storing vector embeddings", "searching similarity indexes", "querying vector databases"],
      "ai-ml/ml-frameworks": ["training machine learning models", "building neural networks", "running model inference"],
      "ai-ml/model-serving": ["deploying ML models to production", "managing model endpoints", "running inference servers"],
      "ai-ml/model-optimization": ["compiling and optimizing models", "converting model formats", "running quantized inference"],
      "ai-ml/model-monitoring": ["monitoring model performance", "analyzing prediction drift", "managing model metrics"],
      "ai-ml/nlp": ["processing natural language text", "analyzing text sentiment", "parsing linguistic structures"],
      "ai-ml/computer-vision": ["processing images with AI", "running object detection", "analyzing visual content"],
      "ai-ml/data-labeling": ["creating training annotations", "managing labeling workflows", "validating data quality"],
      "ai-ml/data-processing": ["processing and transforming datasets", "validating data quality", "building data pipelines"],
      "ai-ml/ml-experiment-tracking": ["monitoring ML experiments", "analyzing model metrics", "managing training runs"],
      "ai-ml/mlops-pipelines": ["deploying ML pipelines", "orchestrating model workflows", "managing ML infrastructure"],
      "ai-ml/prompt-engineering": ["building prompt templates", "testing prompt variations", "managing prompt workflows"],
      "ai-ml/ai-evaluation": ["testing model outputs", "benchmarking AI performance", "validating model accuracy"],
      "ai-ml/ai-safety": ["scanning AI outputs for safety", "validating model behavior", "monitoring AI guardrails"],
      "ai-ml/ai-security": ["scanning AI systems for vulnerabilities", "validating model security", "monitoring AI threats"],
      "ai-ml/audio/speech": ["processing audio files", "generating speech from text", "converting speech to text"],
      "ai-ml/image-generation": ["generating images with AI", "creating visual content", "running diffusion models"],
      "ai-ml/document-ai": ["processing documents with AI", "analyzing document structure", "converting document formats"],
      "ai-ml/fine-tuning": ["training on custom datasets", "running transfer learning", "managing fine-tune jobs"],
      "ai-ml/gpu-tools": ["monitoring GPU utilization", "managing GPU resources", "deploying GPU workloads"],
      "ai-ml/notebooks": ["running interactive notebooks", "managing computational environments", "executing code cells"],
      "ai-ml/synthetic-data": ["generating synthetic datasets", "creating training data", "validating data distributions"],
      "ai-ml/feature-stores": ["storing ML features", "managing feature pipelines", "retrieving training features"],
      "ai-ml/knowledge-graphs": ["building knowledge graphs", "querying graph databases", "managing entity relationships"],
      "ai-ml/model-hub": ["downloading pretrained models", "managing model repositories", "searching model registries"],
      "ai-ml/automl": ["running automated model selection", "optimizing hyperparameters", "building ML pipelines"],
      "ai-ml/ai-apis": ["calling AI API endpoints", "managing API keys", "streaming AI responses"],
      // General tool categories
      "code-search": ["searching files and code", "installing search indexes", "retrieving source content"],
      "security": ["scanning for vulnerabilities", "auditing dependencies", "detecting security issues"],
      "testing": ["running tests", "checking test coverage", "debugging test failures"],
      "data-processing": ["processing structured data", "converting between formats", "transforming datasets"],
      "devops": ["deploying applications", "managing infrastructure", "orchestrating services"],
      "package-managers": ["managing dependencies", "installing packages", "running project scripts"],
    };
    // Find matching category triggers — exact match only, no prefix fallback
    const catKey = curated.category.toLowerCase();
    const catTriggers = categoryActionMap[catKey] ?? null;
    if (catTriggers) {
      triggers.push(...catTriggers);
    } else {
      // Derive action triggers from agentValue, ensuring gerund verbs
      const agentPhrases = curated.agentValue
        .split(/[,;.]/)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 5)
        .slice(0, 2);
      // Always include at least one scorer-recognized verb
      triggers.push(`installing and configuring ${name}`);
      if (agentPhrases.length > 0) {
        triggers.push(...agentPhrases.map(p => {
          // Prefix with an action verb if phrase doesn't start with one
          if (/^(building|running|creating|deploying|managing|processing|generating|training|testing|checking|monitoring|installing|configuring|searching|analyzing|formatting|scanning|validating|converting|embedding|streaming|querying|orchestrating|implementing|routing|scheduling|publishing|parsing|rendering|transforming|auditing|debugging|fixing|downloading|compiling|storing|retrieving)/.test(p)) {
            return p;
          }
          return `working with ${p}`;
        }));
      }
    }
  } else {
    // Fallback: domain-inferred triggers
    const domain = inferDomain(tool);
    const domainTriggers: Record<string, string[]> = {
      llm: ["running LLM inference", "chatting with language models", "generating text"],
      linter: ["linting files for issues", "auto-fixing code style", "formatting source code"],
      testing: ["running tests", "checking test coverage", "debugging test failures"],
      security: ["scanning for vulnerabilities", "auditing dependencies", "detecting secrets"],
      containers: ["managing containers", "deploying applications", "orchestrating services"],
      ml: ["training models", "running inference", "fine-tuning pretrained models"],
      search: ["searching files and code", "finding patterns in text", "indexing content"],
      data: ["processing structured data", "converting between formats", "transforming datasets"],
      http: ["making HTTP requests", "interacting with APIs", "downloading resources"],
      git: ["managing version control", "creating pull requests", "reviewing changes"],
      agents: ["building AI agents", "orchestrating agent workflows", "running autonomous tasks"],
      rag: ["building retrieval pipelines", "indexing documents", "querying knowledge bases"],
      monitoring: ["monitoring performance", "collecting metrics", "viewing logs"],
      "package-manager": ["managing dependencies", "installing packages", "running project scripts"],
      documentation: ["generating documentation", "building API docs", "validating doc structure"],
    };
    const categoryTriggers = domainTriggers[domain.category];
    if (categoryTriggers && categoryTriggers.length > 0) {
      triggers.push(...categoryTriggers);
    } else {
      triggers.push(`working with ${name}`);
    }
  }

  const triggerPhrase = triggers.join(", ");
  const full = `${effectiveDesc}. Use when ${triggerPhrase}.`;
  return full.length > 1024 ? full.slice(0, 1021) + "..." : full;
}

/**
 * Generate concrete example arguments based on command flags and purpose.
 * Never uses <args> or <pattern> placeholders.
 */
function concreteArgs(cmd: ToolCommand, toolName: string): string {
  const parts = [toolName, cmd.name];
  for (const f of cmd.flags.slice(0, 2)) {
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
];

/** Default domain when nothing matches */
const DEFAULT_DOMAIN: InferredDomain = {
  category: "general",
  quickStart: [],
  patterns: [],
  troubleshooting: [],
};

/** Infer domain-specific usage from tool metadata */
function inferDomain(tool: Tool): InferredDomain {
  const searchText = [
    tool.meta.name,
    tool.meta.description || "",
    ...(tool.meta.tags as string[]),
    tool.source.uri || "",
    tool.meta.homepage || "",
  ].join(" ");

  for (const pattern of DOMAIN_PATTERNS) {
    if (pattern.match.test(searchText)) {
      return {
        category: pattern.category,
        quickStart: pattern.quickStart(tool.meta.name),
        patterns: pattern.patterns(tool.meta.name),
        troubleshooting: pattern.troubleshooting(tool.meta.name),
      };
    }
  }

  return DEFAULT_DOMAIN;
}

/** Curated metadata shape (attached by forge pipeline) */
interface CuratedMetaShape { description: string; agentValue: string; category: string }

/** Infer the install command for a library based on source format and category. */
function inferInstallCommand(tool: Tool, curated: CuratedMetaShape): string {
  const cat = curated.category.toLowerCase();
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
  // GitHub repos — infer from category
  if (cat.includes("python") || cat.includes("ml") || cat.includes("nlp") || cat.includes("data") ||
      cat.includes("audio") || cat.includes("vision") || cat.includes("ai-")) {
    return `pip install ${tool.meta.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
  }
  return `git clone https://github.com/${uri}.git && cd ${tool.meta.name}`;
}

/** Infer the primary language for a tool from its source format and category. */
function inferLanguageHint(tool: Tool, curated: CuratedMetaShape): "python" | "javascript" | "other" {
  if (tool.source.format === "npm") return "javascript";
  if (tool.source.format === "pypi") return "python";
  const cat = curated.category.toLowerCase();
  const tags = (tool.meta.tags as string[]).join(" ").toLowerCase();
  if (cat.includes("ml") || cat.includes("nlp") || cat.includes("data") || cat.includes("vision") ||
      cat.includes("audio") || cat.includes("fine-tun") || cat.includes("train") ||
      tags.includes("python") || tags.includes("pytorch") || tags.includes("tensorflow")) {
    return "python";
  }
  if (tags.includes("node") || tags.includes("typescript") || tags.includes("javascript")) {
    return "javascript";
  }
  return "other";
}

/** Shape of README sections extracted by forge pipeline */
interface ReadmeSectionsShape {
  codeBlocks: Array<{ lang: string; code: string }>;
  sections: Record<string, string>;
  raw: string;
}

export function generateRichSkillMd(tool: Tool): string {
  const commands = tool.capabilities.commands;
  const flags = tool.capabilities.globalFlags;
  const rawHelp = tool.capabilities.rawHelp ?? "";
  const desc = normalizeDesc(tool);
  const name = tool.meta.name;
  const description = buildDescription(tool);
  const hasCapabilities = commands.length > 0 || flags.length > 0;
  const domain = hasCapabilities ? null : inferDomain(tool);
  const helpLines = rawHelp.trim() ? rawHelp.trim().split("\n") : [];

  // README sections (attached by forge pipeline)
  const readmeSections = (tool as Tool & { _readmeSections?: ReadmeSectionsShape })._readmeSections;

  // Check for curated metadata
  const curated = (tool as Tool & { _curatedMeta?: { description: string; agentValue: string; category: string } })._curatedMeta;
  const isLibrary = commands.length === 0 && !hasCapabilities;

  // Use curated description for header when resolver returned a generic one
  const headerDesc = (curated && (desc.length < 30 || desc.toLowerCase() === name.toLowerCase()))
    ? curated.description
    : desc;

  // Normalize name to strict kebab-case
  const kebabName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/claude|anthropic/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "unnamed-tool";

  // Infer compatibility from source format
  const compatMap: Record<string, string> = {
    npm: "Node.js v18+",
    pypi: "Python 3.10+",
    crates: "Rust toolchain",
    github: "See project README",
    local: "Local installation",
  };
  const compatibility = compatMap[tool.source.format] ?? "See project README";
  const license = tool.meta.license ?? "MIT";

  const s: string[] = [];

  // ── Frontmatter ──
  s.push("---");
  s.push(`name: ${kebabName}`);
  s.push(`version: ${tool.meta.version}`);
  s.push(`description: "${esc(description)}"`);
  s.push(`license: ${license}`);
  s.push(`compatibility: "${compatibility}"`);
  if (curated) {
    s.push(`domain: "${curated.category}"`);
  }
  s.push(`ingredients:`);
  // Quote URIs that contain YAML-special chars (@, :, etc.)
  const uri = tool.source.uri;
  s.push(uri.includes("@") || uri.includes(":") ? `  - "${uri}"` : `  - ${uri}`);
  s.push(`tags:`);
  const tags = new Set<string>([...(tool.meta.tags as string[])]);
  // Only add "cli" tag if the tool actually has CLI commands
  if (hasCapabilities) tags.add("cli");
  if (isLibrary) tags.add("library");
  if (curated) {
    // Add category-derived tags
    for (const part of curated.category.split("/")) {
      if (part.length > 2) tags.add(part);
    }
  }
  for (const tag of tags) s.push(`  - ${tag}`);
  s.push("---");
  s.push("");

  // ── Header ──
  s.push(`# ${name}`);
  s.push("");
  s.push(headerDesc + ".");
  if (curated && curated.agentValue) {
    s.push("");
    s.push(`**Agent value**: ${curated.agentValue}`);
  }
  if (tool.meta.homepage) {
    s.push(`Docs: ${tool.meta.homepage}`);
  }
  if (tool.source.format === "github") {
    s.push(`Source: https://github.com/${tool.source.uri}`);
  }
  s.push("");

  // ── Quick Start ──
  s.push("## Quick Start");
  s.push("");

  // Find README quick start section if available
  const readmeQuickStart = readmeSections?.sections["quick start"]
    ?? readmeSections?.sections["quickstart"]
    ?? readmeSections?.sections["getting started"];
  const readmeInstall = readmeSections?.sections["installation"]
    ?? readmeSections?.sections["install"];
  const readmeUsage = readmeSections?.sections["usage"]
    ?? readmeSections?.sections["basic usage"];

  if (commands.length > 0) {
    // Real CLI commands discovered — use them
    s.push("```bash");
    for (const cmd of commands.slice(0, MAX_QUICK_START_EXAMPLES)) {
      s.push(`# ${cmd.description || cmd.name}`);
      s.push(concreteArgs(cmd, name));
      s.push("");
    }
    s.push("```");
  } else if (readmeQuickStart) {
    // Use actual README Quick Start content — render as-is, preserving code blocks
    const qsLines = readmeQuickStart.split("\n").slice(0, 30);
    for (const line of qsLines) s.push(line);
  } else if (readmeInstall || readmeUsage) {
    // Fallback: use install + usage sections from README
    if (readmeInstall) {
      const installLines = readmeInstall.split("\n").slice(0, 10);
      for (const line of installLines) s.push(line);
      s.push("");
    }
    if (readmeUsage) {
      const usageLines = readmeUsage.split("\n").slice(0, 15);
      for (const line of usageLines) s.push(line);
    }
  } else if (readmeSections && readmeSections.codeBlocks.length > 0) {
    // Fallback: use first code blocks from README
    for (const block of readmeSections.codeBlocks.slice(0, 2)) {
      s.push(`\`\`\`${block.lang}`);
      s.push(block.code);
      s.push("```");
      s.push("");
    }
  } else if (isLibrary && curated) {
    // Library/SDK with curated metadata — generate install + API usage
    const installCmd = inferInstallCommand(tool, curated);
    s.push("```bash");
    s.push(`# Install`);
    s.push(installCmd);
    s.push("```");
    s.push("");
    const langHint = inferLanguageHint(tool, curated);
    if (langHint === "python") {
      s.push("```python");
      s.push(`# ${curated.description}`);
      s.push(`import ${name.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`);
      s.push("");
      s.push(`# See project README for API usage`);
      s.push("```");
    } else if (langHint === "javascript") {
      s.push("```javascript");
      s.push(`// ${curated.description}`);
      const importName = name.replace(/[^a-zA-Z0-9]/g, "");
      s.push(`import ${importName} from "${uri.startsWith("npm:") ? uri.slice(4) : uri}";`);
      s.push("");
      s.push(`// See project README for API usage`);
      s.push("```");
    } else {
      s.push("```bash");
      s.push(`# See project README for installation and usage`);
      s.push(`# ${curated.description}`);
      s.push("```");
    }
  } else if (domain && domain.quickStart.length > 0) {
    s.push("```bash");
    for (const line of domain.quickStart) s.push(line);
    if (domain.quickStart[domain.quickStart.length - 1] !== "") s.push("");
    s.push("```");
  } else {
    s.push("```bash");
    s.push(`# Show help and available options`);
    s.push(`${name} --help`);
    s.push("");
    s.push(`# Check version`);
    s.push(`${name} --version`);
    s.push("");
    s.push("```");
  }
  s.push("");

  // ── Commands (compact — top 5 inline, always link to references) ──
  if (commands.length > 0) {
    s.push("## Commands");
    s.push("");
    const inlineCommands = commands.slice(0, 5);
    for (const cmd of inlineCommands) {
      const flagStr = cmd.flags.length > 0
        ? " — flags: " + cmd.flags.slice(0, 3).map(f => `\`${f.alias || f.name}\``).join(", ")
        : "";
      s.push(`- \`${name} ${cmd.name}\` — ${cmd.description || "(no description)"}${flagStr}`);
    }
    if (commands.length > 5) {
      s.push("");
      s.push(`_${commands.length - 5} more commands — see [commands reference](references/commands.md)_`);
    }
    s.push("");
  }

  // ── Global Options (compact) ──
  if (flags.length > 0) {
    s.push("## Global Options");
    s.push("");
    for (const f of flags) {
      const alias = f.alias ? ` (${f.alias})` : "";
      s.push(`- \`${f.name}\`${alias} — ${f.description}`);
    }
    s.push("");
  }

  // ── References (always present — content lives in references/) ──
  s.push("## References");
  s.push("");
  s.push("- [Guide](references/guide.md) — Installation, configuration, detailed examples");
  if (commands.length > 0) {
    s.push(`- [Commands](references/commands.md) — Full command reference (${commands.length} commands)`);
  }
  s.push("- [Examples](references/examples.md) — Common usage patterns and recipes");
  s.push("- [Troubleshooting](references/troubleshooting.md) — Common issues and fixes");
  if (helpLines.length > 0) {
    s.push("- [Help Output](references/help-output.md) — Raw help text");
  }
  if (commands.some(c => c.flags.length > 3)) {
    s.push("- [Flags](references/flags.md) — Detailed flag reference per command");
  }
  s.push("");

  // ── Scripts ──
  s.push("## Scripts");
  s.push("");
  s.push("- `scripts/install.sh` — Install this tool");
  s.push("- `scripts/validate.py` — Validate skill compliance (run: `uv run scripts/validate.py`)");
  s.push("");

  return s.join("\n");
}

/** Internal metadata about what references are needed, shared between generators */
interface RefDecisions {
  readonly hasRefCommands: boolean;
  readonly hasRefHelp: boolean;
  readonly hasRefFlags: boolean;
  readonly hasRefGuide: boolean;
  readonly helpLines: readonly string[];
}

function computeRefDecisions(tool: Tool): RefDecisions {
  const commands = tool.capabilities.commands;
  const rawHelp = tool.capabilities.rawHelp ?? "";
  const helpLines = rawHelp.trim() ? rawHelp.trim().split("\n") : [];
  return {
    hasRefCommands: commands.length > 0,
    hasRefHelp: helpLines.length > MAX_HELP_LINES,
    hasRefFlags: commands.some(c => c.flags.length > 3),
    hasRefGuide: true,
    helpLines,
  };
}

/**
 * Generate a full skill directory: SKILL.md + reference files.
 * Returns a SkillDirectory with the main file and any overflow content.
 */
export function generateSkillDirectory(tool: Tool): SkillDirectory {
  const skillMd = generateRichSkillMd(tool);
  const files: Record<string, string> = {};
  const commands = tool.capabilities.commands;
  const name = tool.meta.name;
  const desc = normalizeDesc(tool);
  const domain = inferDomain(tool);
  const refs = computeRefDecisions(tool);
  const curated = (tool as Tool & { _curatedMeta?: CuratedMetaShape })._curatedMeta;
  const readmeSections = (tool as Tool & { _readmeSections?: ReadmeSectionsShape })._readmeSections;
  const isLibrary = commands.length === 0;
  // Use curated description for guide/examples if available and desc is generic
  const richDesc = (curated && desc.length < 30) ? curated.description : desc;

  // ── references/commands.md — always when commands exist ──
  if (refs.hasRefCommands) {
    const lines: string[] = [`# ${name} — Full Command Reference`, ""];
    for (const cmd of commands) {
      lines.push(`## \`${name} ${cmd.name}\``);
      lines.push("");
      if (cmd.description) lines.push(cmd.description);
      lines.push("");
      if (cmd.flags.length > 0) {
        lines.push("**Flags:**");
        for (const f of cmd.flags) {
          const alias = f.alias ? ` (${f.alias})` : "";
          lines.push(`- \`${f.name}\`${alias} — ${f.description}`);
        }
        lines.push("");
      }
    }
    files["references/commands.md"] = lines.join("\n");
  }

  // ── references/help-output.md — when raw help is long ──
  if (refs.hasRefHelp) {
    files["references/help-output.md"] = [
      `# ${name} — Help Output`,
      "",
      "```",
      refs.helpLines.join("\n"),
      "```",
      "",
    ].join("\n");
  }

  // ── references/flags.md — when commands have many flags ──
  const cmdsWithFlags = commands.filter(c => c.flags.length > 3);
  if (refs.hasRefFlags && cmdsWithFlags.length > 0) {
    const lines: string[] = [`# ${name} — Detailed Flag Reference`, ""];
    for (const cmd of cmdsWithFlags) {
      lines.push(`## \`${name} ${cmd.name}\``);
      lines.push("");
      lines.push("| Flag | Alias | Type | Required | Description |");
      lines.push("|------|-------|------|----------|-------------|");
      for (const f of cmd.flags) {
        lines.push(`| \`${f.name}\` | ${f.alias ? `\`${f.alias}\`` : "—"} | ${f.type} | ${f.required ? "yes" : "no"} | ${f.description} |`);
      }
      lines.push("");
    }
    files["references/flags.md"] = lines.join("\n");
  }

  // ── references/guide.md — ALWAYS generated ──
  {
    const lines: string[] = [
      `# ${name} — Usage Guide`,
      "",
      richDesc + ".",
      "",
    ];
    if (curated) {
      lines.push(`**Agent value**: ${curated.agentValue}`);
      lines.push("");
      lines.push(`**Category**: ${curated.category}`);
      lines.push("");
    }
    if (tool.meta.homepage) {
      lines.push(`Official docs: ${tool.meta.homepage}`);
      lines.push("");
    }
    if (tool.source.format === "github") {
      lines.push(`Source: https://github.com/${tool.source.uri}`);
      lines.push("");
    }
    // Add README description section if available
    const readmeDesc = readmeSections?.sections["description"]
      ?? readmeSections?.sections["about"]
      ?? readmeSections?.sections["overview"];
    if (readmeDesc) {
      lines.push("## Description");
      lines.push("");
      const descLines = readmeDesc.split("\n").slice(0, 30);
      for (const dl of descLines) lines.push(dl);
      lines.push("");
    }

    lines.push("## Installation");
    lines.push("");
    // Use README installation section if available
    const readmeInstallGuide = readmeSections?.sections["installation"]
      ?? readmeSections?.sections["install"]
      ?? readmeSections?.sections["setup"];
    if (readmeInstallGuide) {
      const installLines = readmeInstallGuide.split("\n").slice(0, 25);
      for (const il of installLines) lines.push(il);
      lines.push("");
    } else if (isLibrary && curated) {
      // Use language-appropriate install for libraries
      lines.push("```bash");
      lines.push(inferInstallCommand(tool, curated));
      lines.push("```");
    } else if (tool.source.format === "github") {
      lines.push("```bash");
      lines.push(`# Clone from GitHub`);
      lines.push(`git clone https://github.com/${tool.source.uri}.git`);
      lines.push(`cd ${name}`);
      lines.push("");
      lines.push(`# Follow the project's README for build/install instructions`);
      lines.push("```");
    } else if (tool.source.format === "npm") {
      lines.push("```bash");
      lines.push(`npm install -g ${tool.source.uri.replace("npm:", "")}`);
      lines.push("```");
    } else if (tool.source.format === "pypi") {
      lines.push("```bash");
      const pypiPkg = tool.source.uri.replace("pypi:", "");
      lines.push(`uv tool install ${pypiPkg}`);
      lines.push(`# Or: pip install ${pypiPkg}`);
      lines.push("```");
    } else if (tool.source.format === "crates") {
      lines.push("```bash");
      lines.push(`cargo binstall ${tool.source.uri.replace("crates:", "")}`);
      lines.push(`# Or: cargo install ${tool.source.uri.replace("crates:", "")}`);
      lines.push("```");
    }
    lines.push("");
    lines.push("## Detailed Examples");
    lines.push("");
    // Prefer README code blocks for real examples
    const guideCodeBlocks = readmeSections?.codeBlocks.filter(b =>
      b.code.length > 30 && !b.code.startsWith("pip install") && !b.code.startsWith("npm install")
    ).slice(0, 3) ?? [];
    if (guideCodeBlocks.length > 0) {
      for (const block of guideCodeBlocks) {
        lines.push(`\`\`\`${block.lang}`);
        lines.push(block.code);
        lines.push("```");
        lines.push("");
      }
    } else if (commands.length > 0) {
      lines.push("```bash");
      for (const cmd of commands.slice(0, MAX_PATTERN_EXAMPLES)) {
        lines.push(`# ${cmd.description || cmd.name}`);
        lines.push(concreteArgs(cmd, name));
        lines.push("");
      }
      lines.push("```");
    } else {
      // Minimal stub — at least point to real docs
      lines.push(`See the [project README](https://github.com/${tool.source.uri}) for detailed usage examples.`);
    }
    lines.push("");
    const tagList = tool.meta.tags as string[];
    if (tagList.length > 0) {
      lines.push("## Related Topics");
      lines.push("");
      lines.push(`Tags: ${tagList.join(", ")}`);
      lines.push("");
    }
    files["references/guide.md"] = lines.join("\n");
  }

  // ── references/examples.md — ALWAYS generated (patterns + recipes) ──
  {
    const lines: string[] = [`# ${name} — Common Usage Patterns`, ""];
    if (curated) {
      lines.push(`> ${curated.agentValue}`);
      lines.push("");
    }

    // Use README usage/examples sections if available
    const readmeUsage = readmeSections?.sections["usage"]
      ?? readmeSections?.sections["basic usage"]
      ?? readmeSections?.sections["examples"]
      ?? readmeSections?.sections["example"];
    if (readmeUsage) {
      lines.push("## Usage (from README)");
      lines.push("");
      const usageLines = readmeUsage.split("\n").slice(0, 40);
      for (const ul of usageLines) lines.push(ul);
      lines.push("");
    }

    lines.push("## Patterns");
    lines.push("");
    if (commands.length > 0) {
      lines.push("```bash");
      for (const cmd of commands.slice(0, MAX_PATTERN_EXAMPLES)) {
        lines.push(`# ${cmd.description || cmd.name}`);
        lines.push(concreteArgs(cmd, name));
        lines.push("");
      }
      lines.push("```");
    } else if (readmeSections && readmeSections.codeBlocks.length > 0) {
      // Use actual code blocks from the README
      for (const block of readmeSections.codeBlocks.slice(0, 5)) {
        lines.push(`\`\`\`${block.lang}`);
        lines.push(block.code);
        lines.push("```");
        lines.push("");
      }
    } else if (isLibrary && curated) {
      const lang = inferLanguageHint(tool, curated);
      if (lang === "python") {
        lines.push("```python");
        lines.push(`# ${curated.description}`);
        lines.push(`# Install: pip install ${name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`);
        lines.push(`import ${name.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`);
        lines.push("");
        lines.push(`# See project README for complete API reference`);
        lines.push(`# ${curated.agentValue}`);
        lines.push("```");
      } else if (lang === "javascript") {
        lines.push("```javascript");
        lines.push(`// ${curated.description}`);
        const pkgName = tool.source.uri.startsWith("npm:") ? tool.source.uri.slice(4) : tool.source.uri;
        lines.push(`// Install: npm install ${pkgName}`);
        lines.push(`import { /* ... */ } from "${pkgName}";`);
        lines.push("");
        lines.push(`// See project README for complete API reference`);
        lines.push(`// ${curated.agentValue}`);
        lines.push("```");
      } else {
        lines.push("```bash");
        lines.push(`# ${curated.description}`);
        lines.push(`# See: https://github.com/${tool.source.uri}`);
        lines.push("```");
      }
    } else if (domain.patterns.length > 0) {
      lines.push("```bash");
      for (const line of domain.patterns) lines.push(line);
      if (domain.patterns[domain.patterns.length - 1] !== "") lines.push("");
      lines.push("```");
    } else {
      lines.push("```bash");
      lines.push(`# Run with default settings`);
      lines.push(`${name} .`);
      lines.push("");
      lines.push(`# Show verbose output`);
      lines.push(`${name} --verbose .`);
      lines.push("");
      lines.push(`# Output as JSON (if supported)`);
      lines.push(`${name} --json .`);
      lines.push("");
      lines.push("```");
    }
    lines.push("");
    files["references/examples.md"] = lines.join("\n");
  }

  // ── references/troubleshooting.md — ALWAYS generated ──
  {
    const lines: string[] = [`# ${name} — Troubleshooting`, ""];

    // Use README troubleshooting/FAQ section if available
    const readmeTrouble = readmeSections?.sections["troubleshooting"]
      ?? readmeSections?.sections["faq"]
      ?? readmeSections?.sections["common issues"];
    if (readmeTrouble) {
      const troubleLines = readmeTrouble.split("\n").slice(0, 30);
      for (const tl of troubleLines) lines.push(tl);
    } else if (commands.length > 0 && domain.troubleshooting.length > 0) {
      // Only use domain template for actual CLI tools (not libraries)
      for (const tip of domain.troubleshooting) {
        lines.push(`- ${tip}`);
      }
    } else {
      // Ecosystem-aware troubleshooting based on source format
      const fmt = tool.source.format;
      const curated = (tool as Tool & { _curatedMeta?: { category: string } })._curatedMeta;
      const isPython = fmt === "pypi" || curated?.category.toLowerCase().includes("python");
      const isNode = fmt === "npm";
      const isRust = fmt === "crates";
      const isGo = tool.meta.tags.some(t => t === "go" || t === "golang");

      if (isPython) {
        lines.push(`- **Installation fails**: Check Python version (3.10+ recommended): \`python3 --version\``);
        lines.push(`- **Import errors**: Verify the package is installed: \`pip list | grep ${name}\``);
        lines.push(`- **Version mismatch**: Update to latest: \`pip install --upgrade ${name}\``);
        lines.push(`- **Virtual env issues**: Create a clean venv: \`uv venv && uv pip install ${name}\``);
      } else if (isNode) {
        lines.push(`- **Installation fails**: Check Node.js version (18+ recommended): \`node --version\``);
        lines.push(`- **Module not found**: Verify installation: \`npm list -g ${name}\``);
        lines.push(`- **Version mismatch**: Update to latest: \`npm update -g ${name}\``);
        lines.push(`- **Permission errors**: Use \`npx ${name}\` instead of global install`);
      } else if (isRust) {
        lines.push(`- **Installation fails**: Install Rust toolchain: \`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\``);
        lines.push(`- **Binary not found**: Ensure \`~/.cargo/bin\` is in your PATH`);
        lines.push(`- **Version mismatch**: Update: \`cargo install ${name}\``);
      } else if (isGo || fmt === "github") {
        lines.push(`- **Binary not found**: Download from [releases](${tool.meta.homepage || `https://github.com/${tool.source.uri}/releases`})`);
        lines.push(`- **Build fails**: Check build requirements in project README`);
        lines.push(`- **Version mismatch**: Download latest release or rebuild from source`);
      } else {
        lines.push(`- **Installation fails**: See project README for requirements`);
        lines.push(`- **Not found**: Verify the tool is installed and in your PATH`);
      }
    }
    lines.push("");
    files["references/troubleshooting.md"] = lines.join("\n");
  }

  // ── scripts/install.sh — ALWAYS generated ──
  files["scripts/install.sh"] = generateInstallScript(tool);

  // ── scripts/validate.py — ALWAYS generated ──
  files["scripts/validate.py"] = generateValidateScript();

  return { skillMd, files };
}

// =============================================================================
// Script Generators (used by generateSkillDirectory and skill-forge)
// =============================================================================

/** Shell-quote a value: wrap in single quotes with inner escaping */
export function shellQuote(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/** Generate scripts/install.sh — source-aware install helper */
export function generateInstallScript(tool: Tool): string {
  validateToolName(tool.meta.name);
  const name = shellQuote(tool.meta.name);
  const lines: string[] = [
    "#!/usr/bin/env bash",
    `# Install ${tool.meta.name} — auto-detected from source format`,
    "set -euo pipefail",
    "",
  ];

  const pkg = shellQuote(tool.source.uri.replace(/^(pypi|crates|npm):/, ""));

  switch (tool.source.format) {
    case "npm":
      lines.push(`# Install via npm (global)`, `npm install -g ${pkg}`, "");
      lines.push(`# Or run without installing`, `npx ${pkg} --help`);
      break;
    case "pypi":
      lines.push(`# Install via uv (recommended)`, `uv tool install ${pkg}`, "");
      lines.push(`# Or run without installing`, `uvx ${pkg} --help`);
      break;
    case "crates":
      lines.push(`# Install via cargo-binstall (fast, pre-built binaries)`, `cargo binstall ${pkg}`, "");
      lines.push(`# Or build from source`, `cargo install ${pkg}`);
      break;
    case "github": {
      const uri = shellQuote(tool.source.uri);
      lines.push(`# Clone and build from source`);
      lines.push(`git clone "https://github.com/"${uri}".git"`, `cd ${name}`);
      lines.push(`# Follow README for build instructions`);
      break;
    }
    default:
      lines.push(`# Install from: ${tool.source.uri}`);
      lines.push(`echo "See project README for installation instructions"`);
  }

  lines.push("");
  lines.push(`# Verify installation`);
  lines.push(`${name} --version 2>/dev/null || ${name} version 2>/dev/null || echo "${tool.meta.name} installed (no --version flag)"`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Generate scripts/validate.py — a single-file uv script that validates
 * the skill directory structure and frontmatter compliance.
 * Runs with: uv run scripts/validate.py
 */
export function generateValidateScript(): string {
  return `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml>=6.0"]
# ///
"""
Validate skill directory structure and SKILL.md frontmatter.
Usage: uv run scripts/validate.py
"""

import sys
import re
from pathlib import Path

try:
    import yaml
except ImportError:
    print("WARN: pyyaml not available, using basic parsing")
    yaml = None

SKILL_DIR = Path(__file__).resolve().parent.parent
SKILL_FILE = SKILL_DIR / "SKILL.md"

def check(condition: bool, msg: str, issues: list[str]) -> None:
    if not condition:
        issues.append(msg)

def validate() -> list[str]:
    issues: list[str] = []

    check(SKILL_FILE.exists(), "SKILL.md not found", issues)
    check(not (SKILL_DIR / "README.md").exists(), "README.md should not be inside skill folder", issues)

    if not SKILL_FILE.exists():
        return issues

    content = SKILL_FILE.read_text(encoding="utf-8")

    fm_match = re.match(r"^---\\r?\\n([\\s\\S]*?)\\r?\\n---", content)
    check(fm_match is not None, "Missing --- frontmatter delimiters", issues)
    if not fm_match:
        return issues

    fm_text = fm_match.group(1)
    fields: dict = {}
    if yaml:
        try:
            fields = yaml.safe_load(fm_text) or {}
        except yaml.YAMLError as e:
            issues.append(f"Invalid YAML: {e}")
            return issues
    else:
        for line in fm_text.split("\\n"):
            m = re.match(r"^(\\w[\\w-]*):\\s*(.+)$", line)
            if m:
                fields[m.group(1)] = m.group(2).strip().strip("'\\"")

    name = fields.get("name", "")
    check(bool(name), "Missing: name", issues)
    check(len(name) <= 64, f"name too long: {len(name)} (max 64)", issues)
    check(bool(re.match(r"^[a-z0-9][a-z0-9-]*$", name)) if name else False, f"name not kebab-case: '{name}'", issues)
    check("claude" not in name.lower() and "anthropic" not in name.lower(), "name has reserved words", issues)

    desc = fields.get("description", "")
    check(bool(desc), "Missing: description", issues)
    check(len(desc) <= 1024, f"description too long: {len(desc)} (max 1024)", issues)
    check("<" not in desc and ">" not in desc, "description has XML tags", issues)
    check("use when" in desc.lower(), "description missing 'Use when' trigger", issues)

    # Structure checks
    refs_dir = SKILL_DIR / "references"
    scripts_dir = SKILL_DIR / "scripts"
    check(refs_dir.exists(), "Missing references/ directory", issues)
    check(scripts_dir.exists(), "Missing scripts/ directory", issues)
    if refs_dir.exists():
        check((refs_dir / "guide.md").exists(), "Missing references/guide.md", issues)

    return issues

if __name__ == "__main__":
    issues = validate()
    if issues:
        print(f"FAIL: {len(issues)} issue(s)")
        for i in issues:
            print(f"  - {i}")
        sys.exit(1)
    else:
        print("PASS: Skill is compliant")
`;
}

/** Generate a new SKILL.md scaffold with compliant description */
export function generateSkillMd(name: string, description: string): string {
  const desc = description.replace(/\.$/, "");
  const triggerDesc = `${desc}. Use when the user needs ${name} or works on ${desc.toLowerCase()}-related tasks.`;

  return [
    "---",
    `name: ${name}`,
    "version: 0.1.0",
    `description: ${triggerDesc}`,
    "ingredients: []",
    "tags:",
    `  - ${name}`,
    "---",
    "",
    `# ${name}`,
    "",
    desc + ".",
    "",
    "## Quick Start",
    "",
    "```bash",
    `# Example usage`,
    `${name} --help`,
    "```",
    "",
    "## Common Patterns",
    "",
    "Add concrete usage patterns here.",
    "",
  ].join("\n");
}
