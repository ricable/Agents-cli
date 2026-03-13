// =============================================================================
// Core domain types for agents-cli
// =============================================================================

/** Supported source formats for tool resolution */
export type SourceFormat =
  | "github"
  | "npm"
  | "pypi"
  | "crates"
  | "local";

/** Tool installation status */
export type InstallStatus =
  | "installed"
  | "pending"
  | "failed"
  | "outdated";

/** Analysis method used to discover tool capabilities.
 *  - "help-probe": only ran --help, no structured parsing succeeded
 *  - "flag-parse": parsed commands/flags from --help output
 *  - "verified": commands individually confirmed via smokeTest (set by forge stages.ts)
 *  - "llm": LLM-assisted analysis
 *  - "manual": manually specified */
export type AnalysisMethod =
  | "help-probe"
  | "flag-parse"
  | "llm"
  | "manual"
  | "verified";

/** Guard types for security validation */
export type GuardType =
  | "path-traversal"
  | "command-injection"
  | "size-limit"
  | "network-scope";

/** Registry cascade layers, ordered by priority */
export type RegistryLayer =
  | "local"
  | "community"
  | "github"
  | "npm"
  | "pypi"
  | "crates";

// =============================================================================
// Tool interfaces
// =============================================================================

/** A resolved source reference for a tool */
export interface ToolSource {
  readonly format: SourceFormat;
  readonly uri: string;
  readonly ref?: string;
  readonly subpath?: string;
}

/** A single flag/option exposed by a CLI tool */
export interface ToolFlag {
  readonly name: string;
  readonly alias?: string;
  readonly description: string;
  readonly type: "boolean" | "string" | "number";
  readonly required: boolean;
  readonly defaultValue?: string | number | boolean;
}

/** A subcommand exposed by a CLI tool */
export interface ToolCommand {
  readonly name: string;
  readonly description: string;
  readonly flags: readonly ToolFlag[];
}

/** Interaction mode for a CLI tool */
export type InteractionMode = "repl" | "subcommand" | "single";

/** Capabilities discovered by the analyzer */
export interface ToolCapabilities {
  readonly commands: readonly ToolCommand[];
  readonly globalFlags: readonly ToolFlag[];
  readonly analysisMethod: AnalysisMethod;
  readonly rawHelp?: string;
  /** Detected interaction mode: repl (interactive shell), subcommand (git-style), or single (one-shot).
   *  Set by createAnalyzer() on all code paths, but optional in the type since
   *  test fixtures and manually-constructed Tool objects may omit it. */
  readonly interactionMode?: InteractionMode;
}

/** Metadata describing a tool */
export interface ToolMeta {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly homepage?: string;
  readonly license?: string;
  readonly tags: readonly string[];
}

/** Curated metadata from registry or manual curation */
export interface CuratedMeta {
  readonly description: string;
  readonly agentValue: string;
  readonly category: string;
}

/** README sections extracted by the forge pipeline */
export interface ReadmeSections {
  codeBlocks: Array<{ lang: string; code: string; purpose?: "install" | "config" | "usage" | "advanced" | "output" }>;
  sections: Record<string, string>;
  raw: string;
}

/** A fully resolved and analyzed tool */
export interface Tool {
  readonly id: string;
  readonly meta: ToolMeta;
  readonly source: ToolSource;
  readonly capabilities: ToolCapabilities;
  readonly installPath: string;
  readonly status: InstallStatus;
  readonly installedAt: string;
  readonly updatedAt: string;
  /** Curated metadata attached by forge pipeline (optional) */
  readonly _curatedMeta?: CuratedMeta;
  /** README sections attached by forge pipeline (optional) */
  readonly _readmeSections?: ReadmeSections;
  /** Whether the tool is a CLI or a library (set by forge pipeline) */
  readonly _toolKind?: "cli" | "library";
}

// =============================================================================
// Store interfaces
// =============================================================================

/** Options for querying the tool store */
export interface StoreQuery {
  readonly text?: string;
  readonly tags?: readonly string[];
  readonly status?: InstallStatus;
  readonly limit?: number;
  readonly offset?: number;
}

/** Result of a store query */
export interface StoreQueryResult {
  readonly tools: readonly Tool[];
  readonly total: number;
}

/** Interface for the tool storage backend */
export interface ToolStore {
  get(id: string): Promise<Tool | null>;
  list(query?: StoreQuery): Promise<StoreQueryResult>;
  save(tool: Tool): Promise<void>;
  remove(id: string): Promise<boolean>;
  has(id: string): Promise<boolean>;
}

// =============================================================================
// Resolver interfaces
// =============================================================================

/** Result of resolving a source identifier */
export interface ResolveResult {
  readonly source: ToolSource;
  readonly meta: Partial<ToolMeta>;
}

/** Interface for resolving tool source identifiers */
export interface ToolResolver {
  resolve(input: string): Promise<ResolveResult>;
  supports(input: string): boolean;
}

// =============================================================================
// Installer interfaces
// =============================================================================

/** Progress callback for downloads */
export type DownloadProgressCallback = (downloaded: number, total: number) => void;

/** Options for tool installation */
export interface InstallOptions {
  readonly force?: boolean;
  readonly onProgress?: DownloadProgressCallback;
}

/** Result of a tool installation */
export interface InstallResult {
  readonly installPath: string;
  readonly binaries: readonly string[];
  readonly duration: number;
}

/** Interface for installing tools from resolved sources */
export interface ToolInstaller {
  install(source: ToolSource, dest: string, options?: InstallOptions): Promise<InstallResult>;
  supports(format: SourceFormat): boolean;
}

// =============================================================================
// Analyzer interfaces
// =============================================================================

/** Options for tool analysis */
export interface AnalyzeOptions {
  readonly useLlm?: boolean;
  readonly timeout?: number;
  /** Recursively probe subcommands (default: false) */
  readonly recursive?: boolean;
  /** Max depth for recursive probing (default: 3) */
  readonly maxDepth?: number;
}

/** Interface for analyzing installed tool capabilities */
export interface ToolAnalyzer {
  analyze(binPath: string, options?: AnalyzeOptions): Promise<ToolCapabilities>;
}

// =============================================================================
// Agent-first output (gws-style structured JSON on every command)
// =============================================================================

/** Universal JSON envelope for all CLI output — agents parse this, humans get pretty text */
export interface CliOutput<T = unknown> {
  readonly ok: boolean;
  readonly command: string;
  readonly data?: T;
  readonly error?: { code: string; message: string; details?: Record<string, unknown> };
  readonly meta: {
    readonly version: string;
    readonly duration: number;
    readonly timestamp: string;
  };
}

/** A subcommand with recursively-discovered children */
export interface ToolSubcommand {
  readonly name: string;
  readonly description: string;
  readonly flags: readonly ToolFlag[];
  readonly subcommands: readonly ToolSubcommand[];
  readonly examples: readonly string[];
  readonly rawHelp?: string;
}

/** Full schema for a tool's command surface — returned by `agents-cli schema` */
export interface ToolSchema {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly binary: string;
  readonly globalFlags: readonly ToolFlag[];
  readonly commands: readonly ToolSubcommand[];
  readonly totalCommands: number;
  readonly maxDepthProbed: number;
}

/** Dry-run result — shows what would happen without doing it */
export interface DryRunResult {
  readonly action: string;
  readonly resolvedSource?: ToolSource;
  readonly resolvedBinary?: string;
  readonly installPath?: string;
  readonly args?: readonly string[];
}

/** Quality tier for auto-generated skills */
export type SkillTier = "stub" | "basic" | "rich";

/** Options for skill generation */
export interface SkillGenerationOptions {
  readonly tier: SkillTier;
  readonly includeExamples?: boolean;
  readonly includeWorkflows?: boolean;
}

/** Multi-file skill directory output from generateSkillDirectory() */
export interface SkillDirectory {
  /** The main SKILL.md content */
  readonly skillMd: string;
  /** Map of relative paths to file contents (e.g. "references/commands.md" -> content) */
  readonly files: Readonly<Record<string, string>>;
}

// =============================================================================
// Registry interfaces
// =============================================================================

/** A registry entry from the community registry */
export interface RegistryEntry {
  readonly id: string;
  readonly meta: ToolMeta;
  readonly source: ToolSource;
  readonly layer: RegistryLayer;
  readonly verified: boolean;
  readonly downloads: number;
}

/** Search options for the registry */
export interface RegistrySearchOptions {
  readonly query: string;
  readonly layers?: readonly RegistryLayer[];
  readonly limit?: number;
}

/** Interface for the 4-layer registry cascade */
export interface ToolRegistry {
  search(options: RegistrySearchOptions): Promise<readonly RegistryEntry[]>;
  lookup(id: string): Promise<RegistryEntry | null>;
  publish(entry: RegistryEntry): Promise<void>;
}

// =============================================================================
// Skills interfaces
// =============================================================================

/** Compatibility requirements for a skill */
export interface SkillCompatibility {
  readonly node?: string;
  readonly python?: string;
  readonly tools?: readonly string[];
}

/** Frontmatter parsed from a SKILL.md file */
export interface SkillFrontmatter {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly ingredients: readonly string[];
  readonly tags: readonly string[];
  readonly compatibility?: SkillCompatibility;
  readonly domain?: string;
}

/** Bundled resource paths discovered in a skill directory */
export interface SkillResources {
  readonly scripts: readonly string[];
  readonly references: readonly string[];
  readonly assets: readonly string[];
}

/** A resolved skill with its ingredients */
export interface Skill {
  readonly frontmatter: SkillFrontmatter;
  readonly body: string;
  readonly ingredients: readonly Tool[];
  readonly contextPath: string;
  readonly resources?: SkillResources;
}

/** Lock entry in agentcli.lock */
export interface LockEntry {
  readonly id: string;
  readonly version: string;
  readonly source: ToolSource;
  readonly integrity: string;
}

/** Full lockfile structure */
export interface Lockfile {
  readonly version: 1;
  readonly entries: readonly LockEntry[];
  readonly generatedAt: string;
}

// =============================================================================
// MCP + Execution interfaces
// =============================================================================

/** Result of running a tool via the MCP bridge */
export interface AgentRunResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: AgentRunError;
  readonly duration: number;
}

/** Error from a tool run */
export interface AgentRunError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/** MCP server configuration */
export interface McpServerConfig {
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
  readonly toolDirs: readonly string[];
}

// =============================================================================
// Manifest & repo analysis interfaces (from core pipeline)
// =============================================================================

/** A manifest entry describing a repo/package to process */
export interface ManifestEntry {
  domain: string;
  name: string;
  repo: string;
  description: string;
  /** Optional: scope indexing + analysis to a subdirectory of the repo (e.g. "packages/cli") */
  subdir?: string;
  /** Optional: sub-classification within the domain (e.g. "swarm" for agent/swarm) */
  subdomain?: string;
  /** Optional: actual directory name (may differ from frontmatter name due to naming conventions) */
  dirName?: string;
}

/** A collection of manifest entries */
export interface Manifest {
  repos: ManifestEntry[];
}

/** Extended manifest entry with auto-discovery fields */
export interface ExtendedManifestEntry extends ManifestEntry {
  quality_score?: number | null;
  auto_discovered?: boolean;
  classifier_source?: "manual" | "rules" | "llm";
}

/** Skill directory is always flat: src-{name}/ — never domain/name/ nesting. */
export function skillDirName(entry: ManifestEntry): string {
  return entry.name.startsWith("src-") ? entry.name : `src-${entry.name}`;
}

/** A group of exported symbols from a module */
export interface ExportGroup {
  module: string;
  symbols: string[];
}

/** Analysis result for a repository/package */
export interface PackageAnalysis {
  pkgName: string;
  version: string;
  description: string;
  mainFiles: string[];
  exports: string[];
  keywords: string[];
  hasTypes: boolean;
  repoUrl: string;
  readmeExcerpt: string;
  codeExamples: string[];
  exportGroups: ExportGroup[];
}

// =============================================================================
// Config interfaces
// =============================================================================

/** Global CLI configuration */
export interface CliConfig {
  readonly dataDir: string;
  readonly cacheDir: string;
  readonly registryUrl?: string;
  readonly llm?: LlmConfig;
}

/** LLM provider configuration */
export interface LlmConfig {
  readonly provider: "anthropic";
  readonly apiKey?: string;
  readonly model: string;
}

/** Guard configuration for security */
export interface GuardConfig {
  readonly type: GuardType;
  readonly enabled: boolean;
  readonly options?: Readonly<Record<string, unknown>>;
}

// =============================================================================
// Pipeline types for prompt-based discovery
// =============================================================================

/** Capability identifier for pipeline discovery */
export type Capability =
  | "image-generation"
  | "video-generation"
  | "audio-generation"
  | "social-facebook"
  | "social-tiktok"
  | "social-instagram"
  | "social-linkedin"
  | "social-twitter"
  | "social-youtube"
  | "payments-stripe"
  | "payments-paypal"
  | "llm-openai"
  | "llm-anthropic"
  | "llm-google"
  | "llm-local"
  | "llm-aws-bedrock"
  | "vector-storage"
  | "embedding"
  | "rag"
  | "mcp"
  | "agent"
  | "browser-automation"
  | "email"
  | "database"
  | "storage"
  | "websocket"
  | "api-gateway"
  | "authentication";

/** Project type for pipeline classification */
export type ProjectType =
  | "agent-workflow"
  | "website"
  | "merch-store"
  | "ai-assistant"
  | "repo-indexer"
  | "api-service"
  | "chatbot";

/** Parsed prompt result from natural language */
export interface ParsedPrompt {
  projectType: ProjectType | null;
  capabilities: Capability[];
  directTerms: string[];
  techStack: {
    language: string | null;
    framework: string | null;
  };
}

/** Source for discovered packages */
export type PackageSource = "github" | "npm" | "crates";

/** A package discovered during pipeline search */
export interface DiscoveredPackage {
  name: string;
  repo: string;
  domain: string;
  source: PackageSource;
  quality_score: number;
  description: string;
}

/** Pipeline configuration */
export interface PipelineConfig {
  sources: PackageSource[];
  execute: boolean;
  dryRun: boolean;
  minQuality: number;
}

/** Workflow intent classification */
export type WorkflowIntent =
  | "council"
  | "publishing"
  | "ecommerce"
  | "assistant"
  | "api-service"
  | "custom";

/** An entity extracted from a prompt */
export interface ExtractedEntity {
  name: string;
  type: "api" | "service" | "library" | "platform";
  source: PackageSource;
  packageName?: string;
  repoSlug?: string;
  domain: string;
  confidence: number;
}

/** Full prompt analysis result */
export interface PromptAnalysis {
  intent: WorkflowIntent;
  domains: string[];
  entities: ExtractedEntity[];
  capabilities: Capability[];
  complexity: "simple" | "medium" | "complex";
  suggestedPackages: string[];
  suggestedTemplate: string;
  techStack: {
    language: string | null;
    framework: string | null;
  };
}

// =============================================================================
// Pipeline quality reporting
// =============================================================================

/** Quality score for a single pipeline step */
export interface StepQuality {
  step: string;
  score: number;         // 0-1 normalized
  issues: string[];
  durationMs: number;
}

/** Full pipeline quality report */
export interface PipelineReport {
  tool: string;
  source: string;
  steps: StepQuality[];
  aggregate: number;     // weighted average
  passed: boolean;
  failedAt?: string;     // first failing step
  workflows: string[];   // auto-generated workflow names
}

/** Workflow configuration for generation */
export interface WorkflowConfig {
  name: string;
  intent: WorkflowIntent;
  packages: DiscoveredPackage[];
  entities: ExtractedEntity[];
  outputPath: string;
}

/** A generated workflow with all files */
export interface GeneratedWorkflow {
  workflowName: string;
  intent: WorkflowIntent;
  packages: DiscoveredPackage[];
  config: WorkflowConfig;
  files: Record<string, string>;
  envVars: string[];
}

// ── CLI-Anything Types (re-exported from lib/cli-anything/types.ts) ────

export type {
  AppProfile,
  HarnessDesign,
  HarnessBundle,
  TestPlan,
  TestSuite,
  QualityGate6Axis,
  QualityAxis,
  CliAnythingOpts,
  CliAnythingResult,
  AppCategory,
  BackendType,
  GapAnalysis,
  PublishResult,
} from "./cli-anything/types.js";
