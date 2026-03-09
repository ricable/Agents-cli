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
  InteractionMode,
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
  SkillDirectory,
} from "./types.js";

export { readPkgJson, readPkgVersion, walkPackageDirs } from "./pkg-utils.js";
export type { PkgInfo } from "./pkg-utils.js";
export { createResolver, detectFormat, fetchJson, parseGithubOwnerRepo, isPrivateUrl } from "./resolver.js";
export { createInstaller } from "./installer.js";
export { createAnalyzer, findMainBinary, deepProbe, detectInteractionMode, probeHelp, probeWithArgs, probeFlag } from "./analyzer.js";
export { createStore, generateContextMd, getToolInstallDir } from "./store.js";
export { createRegistry } from "./registry.js";
export {
  parseFrontmatter,
  buildContext,
  generateSkillMd,
  generateRichSkillMd,
  generateSkillDirectory,
  discoverResources,
  installTool,
  installSkill,
  listSkills,
  removeSkill,
  parseLockfile,
  generateLockfile,
  writeLockfile,
  readLockfile,
  generateInstallScript,
  generateValidateScript,
} from "./skills.js";
export type { InstalledSkillMeta } from "./skills.js";
export { McpBridge, createMcpConfig } from "./mcp.js";
export type { McpToolDescription } from "./mcp.js";

// Chunking, extraction, and caching (from core pipeline)
export {
  chunkFileAST,
  lineBasedChunk,
  chunkJsonFile,
  chunkMarkdownFile,
  shouldSkipFile,
  filterChunks,
  extractMetadataChunks,
  SKIP_PATTERNS,
} from "./chunker.js";
export type { AstChunk, ChunkLike, MetadataChunk } from "./chunker.js";

export {
  readReadme,
  extractReadmeExcerpt,
  extractCodeBlocks,
  extractExportGroups,
  findEntryPoints,
  analyzeRepo,
} from "./extractor.js";

export {
  SkillCache,
  manifestHash,
  getRepoHeadSha,
  computeFileHash,
  isFileUnchanged,
  recordFileHash,
  clearFileHash,
  closeHashCache,
} from "./cache.js";
export type { CacheEntry } from "./cache.js";

// Also export new types from types.ts
export type {
  ManifestEntry,
  Manifest,
  ExtendedManifestEntry,
  ExportGroup,
  PackageAnalysis,
} from "./types.js";

// Agent-first output layer
export { success, failure, emit, toErrorMessage } from "./output.js";

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

// Domain DB layer (lazy better-sqlite3)
export {
  ensureDb,
  getDomainDb,
  domainDbPath,
  closeAllDomainDbs,
  ALL_DOMAINS,
} from "./db/domain-db.js";
export type { Domain, DatabaseInstance } from "./db/domain-db.js";

export {
  getAggregatedDb,
  upsertToAggregated,
  closeAggregatedDb,
  mergeAllDomainsToAggregated,
} from "./db/aggregated-db.js";

export {
  ensureSqlite,
  RVF_SCHEMA,
  applyWalPragmas,
  upsertChunks,
} from "./db/sqlite.js";

// Search (lazy better-sqlite3 + @huggingface/transformers)
export { hybridSearch } from "./search.js";
export type { SearchOptions, SearchResult } from "./search.js";

// Skill factory
export { runSkillFactory } from "./skill-factory.js";
export type { SkillFactoryOptions, SkillFactoryResult } from "./skill-factory.js";

// Plugin system
export { buildPlugins } from "./plugin/builder.js";
export type { PluginJson, BuildPluginsOptions } from "./plugin/builder.js";
export { publishPlugin, publishAllPlugins } from "./plugin/publisher.js";
export { generateAgentDefs, defaultAgentDef } from "./plugin/ai-generator.js";
export type { AgentDef } from "./plugin/ai-generator.js";
export { generateMarketplace } from "./plugin/marketplace.js";
export type { MarketplaceResult, MarketplaceConfig, MarketplaceOptions } from "./plugin/marketplace.js";

// MCP skill bridge
export { callOpensrc, opensrc } from "./mcp-skill.js";
export type { OpensrcOp } from "./mcp-skill.js";

// Indexer (lazy better-sqlite3 + fast-glob)
export { indexSources } from "./indexer.js";
export type { IndexOptions, IndexResult } from "./indexer.js";

// Domains (trigger phrases for skill description generation)
export { DOMAIN_TRIGGERS } from "./domains.js";

// Skill content (structural SKILL.md generation)
export {
  buildName,
  buildDescription,
  extractKeyTerms,
  generateSearchQueries,
  generateMcpQueries,
  generateStructuralSkill,
  generatePatternsFile,
  generateApiFile,
  generateSearchScript,
  generateGrepScript,
} from "./skill-content.js";

// Indexes (hierarchical 3-level indexing)
export { groupByDomain, generateDomainIndex, generateMasterIndex, lookupDomain } from "./indexes.js";
export type { DomainTriggers, ManifestLike } from "./indexes.js";

// Skill tester
export {
  parseSkillFrontmatter,
  scoreSkillDescription,
  scoreTrigger,
  testSkillSync,
  testAllSkillsSync,
  generateTriggerQueries,
  generateNonTriggerQueries,
  printQualityReport,
  testSkill,
  testAllSkills,
  printQualityReportFull,
} from "./skill-tester.js";
export type { FrontmatterFields, SkillTestResult, SkillTestResultFull } from "./skill-tester.js";

// Validators (additional guards)
export { validateSkillContent, validateFullFrontmatter } from "./guards.js";

// Pipeline intelligence
export { classifyIntent } from "./pipeline/intent.js";
export type { IntentResult } from "./pipeline/intent.js";
export { CAPABILITY_SEARCH_MAP } from "./pipeline/capability-map.js";
export { extractEntities, KNOWN_ENTITIES } from "./pipeline/entity-extractor.js";
export type { EntityMapping } from "./pipeline/entity-extractor.js";
export { parsePrompt } from "./pipeline/prompt-parser.js";
export { generateSkillFromWorkflow, writeSkill } from "./pipeline/workflow-gen.js";
export type { SkillConfig } from "./pipeline/workflow-gen.js";
export { generateFromTemplate } from "./pipeline/templates/template-engine.js";
export { getTemplate, getAllTemplates } from "./pipeline/templates/index.js";

// Classifiers
export { discoverNpmPackages } from "./classifier/npm.js";
export {
  discoverTrendingRepos,
  discoverGitHubRepos,
  fetchHtml,
  scrapeTrendingHtml,
  isLikelyCli,
  getWellKnownCliRepos,
} from "./classifier/github.js";
export type { TrendingPeriod, TrendingOptions, TrendingRepo } from "./classifier/github.js";
export { discoverPyPIPackages } from "./classifier/pypi.js";

// Curated tools registry
export { GENERAL_TOOLS, loadAllTools, loadAiMlTools, getCategories } from "./curated-tools.js";
export type { CliTool } from "./curated-tools.js";
export { discoverCratesPackages } from "./classifier/crates.js";
