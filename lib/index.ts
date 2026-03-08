// Public SDK entry point
export type {
  // Core types
  SourceFormat,
  InstallStatus,
  AnalysisMethod,
  GuardType,
  RegistryLayer,
  // Tool interfaces
  ToolSource,
  ToolFlag,
  ToolCommand,
  ToolCapabilities,
  ToolMeta,
  Tool,
  // Store
  StoreQuery,
  StoreQueryResult,
  ToolStore,
  // Resolver
  ResolveResult,
  ToolResolver,
  // Installer
  DownloadProgressCallback,
  InstallOptions,
  InstallResult,
  ToolInstaller,
  // Analyzer
  AnalyzeOptions,
  ToolAnalyzer,
  // Registry
  RegistryEntry,
  RegistrySearchOptions,
  ToolRegistry,
  // Skills
  SkillCompatibility,
  SkillFrontmatter,
  SkillResources,
  Skill,
  LockEntry,
  Lockfile,
  // MCP
  AgentRunResult,
  AgentRunError,
  McpServerConfig,
  // Config
  CliConfig,
  LlmConfig,
  GuardConfig,
  // Agent-first (gws-style)
  CliOutput,
  ToolSubcommand,
  ToolSchema,
  DryRunResult,
  SkillTier,
  SkillGenerationOptions,
} from "./types.js";

export { readPkgJson, readPkgVersion, walkPackageDirs } from "./pkg-utils.js";
export type { PkgInfo } from "./pkg-utils.js";
export { createResolver, detectFormat, fetchJson, parseGithubOwnerRepo, isPrivateUrl } from "./resolver.js";
export { createInstaller } from "./installer.js";
export { createAnalyzer, findMainBinary, deepProbe } from "./analyzer.js";
export { createStore, generateContextMd, getToolInstallDir } from "./store.js";
export { createRegistry } from "./registry.js";
export {
  parseFrontmatter,
  buildContext,
  generateSkillMd,
  generateRichSkillMd,
  discoverResources,
  installTool,
  installSkill,
  listSkills,
  removeSkill,
  parseLockfile,
  generateLockfile,
  writeLockfile,
  readLockfile,
} from "./skills.js";
export type { InstalledSkillMeta } from "./skills.js";
export { McpBridge, createMcpConfig } from "./mcp.js";
export type { McpToolDescription } from "./mcp.js";

// Agent-first output layer
export { success, failure, emit } from "./output.js";

// Input hardening guards
export {
  rejectControlChars,
  rejectPathTraversal,
  rejectEmbeddedParams,
  rejectPercentEncoding,
  validateSource,
  validateToolName,
  validateRunArgs,
  InputValidationError,
} from "./guards.js";
