/**
 * cli-anything/types.ts — Core types for the CLI-Anything pipeline.
 *
 * Converts any GUI application into an agent-native CLI harness
 * via a 7-phase pipeline: Analyze → Design → Implement → Plan Tests →
 * Write Tests → Document → Publish.
 */

// ── App Introspection ──────────────────────────────────────────────────

export type BackendType = "applescript" | "python-binding" | "subprocess" | "dbus" | "rest-api";
export type AppCategory = "creative" | "office" | "devtools" | "communication" | "generic";

export interface ApiEndpoint {
  name: string;
  description: string;
  args: Array<{ name: string; type: string; required: boolean; description: string }>;
  returnType: string;
  group: string;
}

export interface AppProfile {
  name: string;
  displayName: string;
  version: string;
  installed: boolean;
  installHint: string;
  scriptable: boolean;
  backendType: BackendType;
  apiSurface: ApiEndpoint[];
  bindings: string[];
  category: AppCategory;
  binaryPath: string;
}

// ── Harness Design ─────────────────────────────────────────────────────

export interface CommandDesign {
  name: string;
  group: string;
  description: string;
  args: Array<{ name: string; type: string; required: boolean; description: string; default?: string }>;
  returnSchema: Record<string, unknown>;
}

export interface ReplConfig {
  banner: string;
  prompt: string;
  historyFile: string;
  undoSupport: boolean;
}

export interface OutputSchema {
  ok: "boolean";
  command: "string";
  data: "object";
  meta: {
    version: "string";
    duration: "number";
    timestamp: "string";
  };
}

export interface HarnessDesign {
  packageName: string;
  commands: CommandDesign[];
  groups: string[];
  replConfig: ReplConfig;
  outputSchema: OutputSchema;
}

// ── Harness Bundle ─────────────────────────────────────────────────────

export interface HarnessFile {
  path: string;
  content: string;
}

export interface HarnessBundle {
  packageName: string;
  files: HarnessFile[];
  design: HarnessDesign;
  profile: AppProfile;
  entryPoint: string;
}

// ── Testing ────────────────────────────────────────────────────────────

export type TestCategory = "unit" | "integration" | "e2e" | "docker";

export interface TestCase {
  name: string;
  category: TestCategory;
  command: string;
  expectedFields: string[];
  description: string;
}

export interface TestPlan {
  tests: TestCase[];
  totalCount: number;
  byCategory: Record<TestCategory, number>;
  dockerImage?: string;
}

export interface TestSuite {
  files: HarnessFile[];
  runCommand: string;
  markers: string[];
}

// ── Quality Gate (6-Axis) ──────────────────────────────────────────────

export type QualityAxis =
  | "trigger"
  | "quality"
  | "content"
  | "testCoverage"
  | "apiCompleteness"
  | "reliability";

export interface AxisScore {
  axis: QualityAxis;
  score: number;
  threshold: number;
  passed: boolean;
  details: string;
}

export interface QualityGate6Axis {
  axes: AxisScore[];
  overall: number;
  passed: boolean;
}

// ── Documentation ──────────────────────────────────────────────────────

export interface DocBundle {
  readme: string;
  changelog: string;
  references: Record<string, string>;
}

// ── Pipeline ───────────────────────────────────────────────────────────

export interface PhaseResult {
  phase: number;
  name: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface CliAnythingOpts {
  appName: string;
  deep: boolean;
  dryRun: boolean;
  force: boolean;
  json: boolean;
  ai: boolean;
  tier: string;
  outputDir: string;
  orchestrate: boolean;
  recipe?: string;
  refine?: boolean;
  batch?: boolean;
}

export interface CliAnythingResult {
  profile: AppProfile;
  design: HarnessDesign;
  bundle: HarnessBundle;
  testPlan: TestPlan;
  testSuite: TestSuite;
  docs: DocBundle;
  quality: QualityGate6Axis;
  published: PublishResult;
  phases: PhaseResult[];
}

// ── Publishing ─────────────────────────────────────────────────────────

export interface PublishResult {
  skillMd: string;
  skillDir: string;
  pluginDir?: string;
  hooksFile?: string;
  agentDefs?: string[];
  mcpRegistered: boolean;
  storeRegistered: boolean;
}

// ── Refinement ─────────────────────────────────────────────────────────

export interface GapAnalysis {
  apiCoverage: { covered: number; total: number; missing: string[] };
  testCoverage: { covered: number; total: number; missing: string[] };
  docGaps: string[];
  outputSchemaIssues: string[];
  reliabilityIssues: string[];
  overallScore: number;
}

// ── Registry ───────────────────────────────────────────────────────────

export interface AppRegistryEntry {
  name: string;
  displayName: string;
  category: AppCategory;
  binaries: string[];
  scriptable: boolean;
  backendType: BackendType;
  bindings: string[];
  installHint: string;
  apiGroups: string[];
  templateModule?: string;
}
