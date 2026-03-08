import { z } from "zod";
import type {
  SourceFormat,
  InstallStatus,
  AnalysisMethod,
  GuardType,
  RegistryLayer,
} from "./types.js";

// =============================================================================
// Enum schemas
// =============================================================================

export const sourceFormatSchema = z.enum([
  "github",
  "npm",
  "local",
]) satisfies z.ZodType<SourceFormat>;

export const installStatusSchema = z.enum([
  "installed",
  "pending",
  "failed",
  "outdated",
]) satisfies z.ZodType<InstallStatus>;

export const analysisMethodSchema = z.enum([
  "help-probe",
  "flag-parse",
  "llm",
  "manual",
]) satisfies z.ZodType<AnalysisMethod>;

export const guardTypeSchema = z.enum([
  "path-traversal",
  "command-injection",
  "size-limit",
  "network-scope",
]) satisfies z.ZodType<GuardType>;

export const registryLayerSchema = z.enum([
  "local",
  "community",
  "github",
  "npm",
]) satisfies z.ZodType<RegistryLayer>;

// =============================================================================
// Tool schemas
// =============================================================================

export const toolSourceSchema = z.object({
  format: sourceFormatSchema,
  uri: z.string().min(1),
  ref: z.string().optional(),
  subpath: z.string().optional(),
});

export const toolFlagSchema = z.object({
  name: z.string().min(1),
  alias: z.string().optional(),
  description: z.string(),
  type: z.enum(["boolean", "string", "number"]),
  required: z.boolean(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const toolCommandSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  flags: z.array(toolFlagSchema),
});

export const toolCapabilitiesSchema = z.object({
  commands: z.array(toolCommandSchema),
  globalFlags: z.array(toolFlagSchema),
  analysisMethod: analysisMethodSchema,
  rawHelp: z.string().optional(),
});

export const toolMetaSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string(),
  homepage: z.string().url().optional(),
  license: z.string().optional(),
  tags: z.array(z.string()),
});

export const toolSchema = z.object({
  id: z.string().min(1),
  meta: toolMetaSchema,
  source: toolSourceSchema,
  capabilities: toolCapabilitiesSchema,
  installPath: z.string().min(1),
  status: installStatusSchema,
  installedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// =============================================================================
// Store schemas
// =============================================================================

export const storeQuerySchema = z.object({
  text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: installStatusSchema.optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// =============================================================================
// Registry schemas
// =============================================================================

export const registryEntrySchema = z.object({
  id: z.string().min(1),
  meta: toolMetaSchema,
  source: toolSourceSchema,
  layer: registryLayerSchema,
  verified: z.boolean(),
  downloads: z.number().int().nonnegative(),
});

export const registrySearchOptionsSchema = z.object({
  query: z.string().min(1),
  layers: z.array(registryLayerSchema).optional(),
  limit: z.number().int().positive().optional(),
});

// =============================================================================
// Skills schemas
// =============================================================================

export const skillFrontmatterSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string(),
  ingredients: z.array(z.string()),
  tags: z.array(z.string()),
});

export const lockEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  source: toolSourceSchema,
  integrity: z.string().min(1),
});

export const lockfileSchema = z.object({
  version: z.literal(1),
  entries: z.array(lockEntrySchema),
  generatedAt: z.string().datetime(),
});

// =============================================================================
// Config schemas
// =============================================================================

export const llmConfigSchema = z.object({
  provider: z.literal("anthropic"),
  apiKey: z.string().optional(),
  model: z.string().min(1),
});

export const cliConfigSchema = z.object({
  dataDir: z.string().min(1),
  cacheDir: z.string().min(1),
  registryUrl: z.string().url().optional(),
  llm: llmConfigSchema.optional(),
});

export const guardConfigSchema = z.object({
  type: guardTypeSchema,
  enabled: z.boolean(),
  options: z.record(z.unknown()).optional(),
});

// =============================================================================
// Inferred types (for runtime validation)
// =============================================================================

export type ToolSourceInput = z.infer<typeof toolSourceSchema>;
export type ToolFlagInput = z.infer<typeof toolFlagSchema>;
export type ToolCommandInput = z.infer<typeof toolCommandSchema>;
export type ToolInput = z.infer<typeof toolSchema>;
export type StoreQueryInput = z.infer<typeof storeQuerySchema>;
export type RegistryEntryInput = z.infer<typeof registryEntrySchema>;
export type SkillFrontmatterInput = z.infer<typeof skillFrontmatterSchema>;
export type LockfileInput = z.infer<typeof lockfileSchema>;
export type CliConfigInput = z.infer<typeof cliConfigSchema>;
