// =============================================================================
// Core domain types for agents-cli
// =============================================================================

/** Supported source formats for tool resolution */
export type SourceFormat =
  | "github"
  | "npm"
  | "local";

/** Tool installation status */
export type InstallStatus =
  | "installed"
  | "pending"
  | "failed"
  | "outdated";

/** Analysis method used to discover tool capabilities */
export type AnalysisMethod =
  | "help-probe"
  | "flag-parse"
  | "llm"
  | "manual";

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
  | "npm";

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

/** Capabilities discovered by the analyzer */
export interface ToolCapabilities {
  readonly commands: readonly ToolCommand[];
  readonly globalFlags: readonly ToolFlag[];
  readonly analysisMethod: AnalysisMethod;
  readonly rawHelp?: string;
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
}

/** Interface for analyzing installed tool capabilities */
export interface ToolAnalyzer {
  analyze(binPath: string, options?: AnalyzeOptions): Promise<ToolCapabilities>;
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

/** Frontmatter parsed from a SKILL.md file */
export interface SkillFrontmatter {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly ingredients: readonly string[];
  readonly tags: readonly string[];
}

/** A resolved skill with its ingredients */
export interface Skill {
  readonly frontmatter: SkillFrontmatter;
  readonly body: string;
  readonly ingredients: readonly Tool[];
  readonly contextPath: string;
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
