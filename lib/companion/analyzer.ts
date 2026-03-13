/**
 * companion/analyzer.ts — Natural language description → TechStackProfile.
 *
 * Reuses parsePrompt(), classifyIntent(), extractEntities() from the pipeline,
 * then adds deep tech detection across 11 layers (90+ keywords).
 */

import { parsePrompt } from "../pipeline/prompt-parser.js";
import { classifyIntent } from "../pipeline/intent.js";
import { extractEntities } from "../pipeline/entity-extractor.js";
import type { ParsedPrompt, ExtractedEntity } from "../types.js";
import type { IntentResult } from "../pipeline/intent.js";

// ── Types ──────────────────────────────────────────────────────────────

export type TechLayer =
  | "language"
  | "framework"
  | "database"
  | "infra"
  | "testing"
  | "cicd"
  | "messaging"
  | "monitoring"
  | "auth"
  | "search"
  | "storage";

export interface DetectedTech {
  readonly name: string;
  readonly layer: TechLayer;
  readonly confidence: number;
  readonly variant?: string;
}

export interface TechStackProfile {
  readonly parsed: ParsedPrompt;
  readonly intent: IntentResult;
  readonly entities: readonly ExtractedEntity[];
  readonly techs: readonly DetectedTech[];
  readonly primaryLanguage: string | null;
  readonly complexity: "minimal" | "standard" | "complex" | "enterprise";
}

// ── Tech Detection Map (90+ entries across 11 layers) ──────────────────

interface TechEntry {
  readonly layer: TechLayer;
  readonly confidence: number;
  readonly variant?: string;
}

const TECH_DETECTION_MAP: ReadonlyMap<string, TechEntry> = new Map([
  // ── Languages
  ["python", { layer: "language", confidence: 0.95 }],
  ["typescript", { layer: "language", confidence: 0.95 }],
  ["javascript", { layer: "language", confidence: 0.95 }],
  ["rust", { layer: "language", confidence: 0.95 }],
  ["golang", { layer: "language", confidence: 0.95 }],
  ["java", { layer: "language", confidence: 0.90 }],
  ["kotlin", { layer: "language", confidence: 0.90 }],
  ["swift", { layer: "language", confidence: 0.90 }],
  ["ruby", { layer: "language", confidence: 0.90 }],
  ["php", { layer: "language", confidence: 0.90 }],
  ["c#", { layer: "language", confidence: 0.90 }],
  ["csharp", { layer: "language", confidence: 0.90 }],
  ["elixir", { layer: "language", confidence: 0.90 }],
  ["scala", { layer: "language", confidence: 0.90 }],
  ["zig", { layer: "language", confidence: 0.90 }],

  // ── Frameworks (web/api)
  ["fastapi", { layer: "framework", confidence: 0.95 }],
  ["django", { layer: "framework", confidence: 0.95 }],
  ["flask", { layer: "framework", confidence: 0.95 }],
  ["express", { layer: "framework", confidence: 0.95 }],
  ["nextjs", { layer: "framework", confidence: 0.95 }],
  ["next.js", { layer: "framework", confidence: 0.95 }],
  ["react", { layer: "framework", confidence: 0.95 }],
  ["vue", { layer: "framework", confidence: 0.95 }],
  ["nuxt", { layer: "framework", confidence: 0.95 }],
  ["svelte", { layer: "framework", confidence: 0.90 }],
  ["sveltekit", { layer: "framework", confidence: 0.90 }],
  ["angular", { layer: "framework", confidence: 0.90 }],
  ["hono", { layer: "framework", confidence: 0.90 }],
  ["fastify", { layer: "framework", confidence: 0.90 }],
  ["spring boot", { layer: "framework", confidence: 0.95 }],
  ["spring", { layer: "framework", confidence: 0.85 }],
  ["rails", { layer: "framework", confidence: 0.95 }],
  ["ruby on rails", { layer: "framework", confidence: 0.95 }],
  ["laravel", { layer: "framework", confidence: 0.95 }],
  ["actix", { layer: "framework", confidence: 0.90 }],
  ["axum", { layer: "framework", confidence: 0.90 }],
  ["gin", { layer: "framework", confidence: 0.85 }],
  ["fiber", { layer: "framework", confidence: 0.85 }],
  ["phoenix", { layer: "framework", confidence: 0.90 }],
  ["remix", { layer: "framework", confidence: 0.90 }],
  ["astro", { layer: "framework", confidence: 0.90 }],
  ["solid", { layer: "framework", confidence: 0.80 }],
  ["solidjs", { layer: "framework", confidence: 0.90 }],
  ["elysia", { layer: "framework", confidence: 0.90 }],
  ["trpc", { layer: "framework", confidence: 0.90 }],

  // ── Databases
  ["postgresql", { layer: "database", confidence: 0.95 }],
  ["postgres", { layer: "database", confidence: 0.95, variant: "postgresql" }],
  ["mysql", { layer: "database", confidence: 0.95 }],
  ["mariadb", { layer: "database", confidence: 0.95, variant: "mysql" }],
  ["mongodb", { layer: "database", confidence: 0.95 }],
  ["mongo", { layer: "database", confidence: 0.90, variant: "mongodb" }],
  ["redis", { layer: "database", confidence: 0.95 }],
  ["sqlite", { layer: "database", confidence: 0.90 }],
  ["cassandra", { layer: "database", confidence: 0.90 }],
  ["dynamodb", { layer: "database", confidence: 0.95 }],
  ["supabase", { layer: "database", confidence: 0.90 }],
  ["planetscale", { layer: "database", confidence: 0.90 }],
  ["cockroachdb", { layer: "database", confidence: 0.90 }],
  ["neo4j", { layer: "database", confidence: 0.90 }],
  ["clickhouse", { layer: "database", confidence: 0.90 }],

  // ── Infrastructure
  ["aws", { layer: "infra", confidence: 0.95 }],
  ["gcp", { layer: "infra", confidence: 0.95 }],
  ["google cloud", { layer: "infra", confidence: 0.95, variant: "gcp" }],
  ["azure", { layer: "infra", confidence: 0.95 }],
  ["docker", { layer: "infra", confidence: 0.95 }],
  ["kubernetes", { layer: "infra", confidence: 0.95 }],
  ["k8s", { layer: "infra", confidence: 0.95, variant: "kubernetes" }],
  ["terraform", { layer: "infra", confidence: 0.95 }],
  ["pulumi", { layer: "infra", confidence: 0.90 }],
  ["ansible", { layer: "infra", confidence: 0.90 }],
  ["vercel", { layer: "infra", confidence: 0.90 }],
  ["cloudflare", { layer: "infra", confidence: 0.90 }],
  ["fly.io", { layer: "infra", confidence: 0.90 }],
  ["railway", { layer: "infra", confidence: 0.85 }],
  ["heroku", { layer: "infra", confidence: 0.85 }],
  ["nginx", { layer: "infra", confidence: 0.85 }],
  ["caddy", { layer: "infra", confidence: 0.85 }],

  // ── CI/CD
  ["github actions", { layer: "cicd", confidence: 0.95 }],
  ["github", { layer: "cicd", confidence: 0.70 }],
  ["gitlab ci", { layer: "cicd", confidence: 0.95 }],
  ["jenkins", { layer: "cicd", confidence: 0.90 }],
  ["circleci", { layer: "cicd", confidence: 0.90 }],
  ["travis", { layer: "cicd", confidence: 0.85 }],
  ["ci/cd", { layer: "cicd", confidence: 0.80 }],
  ["ci cd", { layer: "cicd", confidence: 0.80 }],

  // ── Messaging / Queues
  ["kafka", { layer: "messaging", confidence: 0.95 }],
  ["rabbitmq", { layer: "messaging", confidence: 0.95 }],
  ["nats", { layer: "messaging", confidence: 0.90 }],
  ["sqs", { layer: "messaging", confidence: 0.90 }],
  ["celery", { layer: "messaging", confidence: 0.85 }],
  ["bullmq", { layer: "messaging", confidence: 0.85 }],

  // ── Monitoring / Observability
  ["prometheus", { layer: "monitoring", confidence: 0.95 }],
  ["grafana", { layer: "monitoring", confidence: 0.95 }],
  ["datadog", { layer: "monitoring", confidence: 0.95 }],
  ["sentry", { layer: "monitoring", confidence: 0.90 }],
  ["opentelemetry", { layer: "monitoring", confidence: 0.90 }],
  ["otel", { layer: "monitoring", confidence: 0.85, variant: "opentelemetry" }],
  ["elk stack", { layer: "monitoring", confidence: 0.90 }],
  ["jaeger", { layer: "monitoring", confidence: 0.85 }],

  // ── Auth
  ["oauth", { layer: "auth", confidence: 0.85 }],
  ["jwt", { layer: "auth", confidence: 0.85 }],
  ["auth0", { layer: "auth", confidence: 0.95 }],
  ["keycloak", { layer: "auth", confidence: 0.90 }],
  ["clerk", { layer: "auth", confidence: 0.90 }],
  ["nextauth", { layer: "auth", confidence: 0.90 }],
  ["passport", { layer: "auth", confidence: 0.85 }],

  // ── Search
  ["elasticsearch", { layer: "search", confidence: 0.90 }],
  ["opensearch", { layer: "search", confidence: 0.90 }],
  ["meilisearch", { layer: "search", confidence: 0.90 }],
  ["typesense", { layer: "search", confidence: 0.90 }],
  ["algolia", { layer: "search", confidence: 0.90 }],

  // ── Storage
  ["s3", { layer: "storage", confidence: 0.90 }],
  ["minio", { layer: "storage", confidence: 0.85 }],
  ["cloudflare r2", { layer: "storage", confidence: 0.90 }],

  // ── Testing
  ["jest", { layer: "testing", confidence: 0.90 }],
  ["vitest", { layer: "testing", confidence: 0.90 }],
  ["pytest", { layer: "testing", confidence: 0.90 }],
  ["playwright", { layer: "testing", confidence: 0.90 }],
  ["cypress", { layer: "testing", confidence: 0.90 }],
  ["selenium", { layer: "testing", confidence: 0.85 }],
]);

// ── Pre-computed sorted entries + compiled regexes (computed once) ─────

interface CompiledTechEntry {
  readonly keyword: string;
  readonly entry: TechEntry;
  readonly regex: RegExp;
}

const SORTED_TECH_ENTRIES: readonly CompiledTechEntry[] = [...TECH_DETECTION_MAP.entries()]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([keyword, entry]) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,+/&(])${escaped}(?:[\\s,+/&).]|$)`, "i");
    return { keyword, entry, regex };
  });

// ── Framework → Language Inference ────────────────────────────────────

const FRAMEWORK_LANGUAGE_MAP: Readonly<Record<string, string>> = {
  fastapi: "python",
  django: "python",
  flask: "python",
  express: "typescript",
  nextjs: "typescript",
  "next.js": "typescript",
  react: "typescript",
  vue: "typescript",
  nuxt: "typescript",
  svelte: "typescript",
  sveltekit: "typescript",
  angular: "typescript",
  hono: "typescript",
  fastify: "typescript",
  elysia: "typescript",
  trpc: "typescript",
  remix: "typescript",
  astro: "typescript",
  solidjs: "typescript",
  "spring boot": "java",
  spring: "java",
  rails: "ruby",
  "ruby on rails": "ruby",
  laravel: "php",
  actix: "rust",
  axum: "rust",
  gin: "golang",
  fiber: "golang",
  phoenix: "elixir",
};

// ── Entity domain → TechLayer bridge ──────────────────────────────────

const ENTITY_DOMAIN_TO_LAYER: Readonly<Record<string, TechLayer>> = {
  "ai-sdk": "framework",
  "image-gen": "framework",
  payments: "framework",
  social: "framework",
  video: "framework",
  web: "framework",
  ui: "framework",
  database: "database",
  auth: "auth",
};

// ── Main Function ─────────────────────────────────────────────────────

/**
 * Analyze a natural language project description into a structured tech stack profile.
 */
export function analyzeProject(description: string): TechStackProfile {
  // 1. Reuse pipeline parsers
  const parsed = parsePrompt(description);
  const intent = classifyIntent(description);
  const entities = extractEntities(description);

  // 2. Scan description against pre-compiled tech entries (longest match first)
  const techs: DetectedTech[] = [];
  const seen = new Set<string>();
  const lower = description.toLowerCase();

  for (const { keyword, entry, regex } of SORTED_TECH_ENTRIES) {
    if (regex.test(lower) || lower === keyword) {
      const canonicalName = entry.variant ?? keyword;
      if (seen.has(canonicalName)) continue;
      seen.add(canonicalName);

      techs.push({
        name: canonicalName,
        layer: entry.layer,
        confidence: entry.confidence,
        variant: entry.variant,
      });
    }
  }

  // 3. Bridge entities to techs (entities from pipeline may detect things our map doesn't)
  for (const entity of entities) {
    const layer = ENTITY_DOMAIN_TO_LAYER[entity.domain];
    if (!layer) continue;
    const entityName = entity.name.toLowerCase();
    if (seen.has(entityName)) continue;
    seen.add(entityName);
    techs.push({
      name: entityName,
      layer,
      confidence: entity.confidence * 0.8, // slightly lower for bridged entities
    });
  }

  // 4. Infer primary language
  let primaryLanguage: string | null = null;

  // First check for explicit language detections
  const explicitLangs = techs.filter(t => t.layer === "language");
  if (explicitLangs.length > 0) {
    primaryLanguage = explicitLangs[0]!.name;
  }

  // If no explicit language, infer from frameworks
  if (!primaryLanguage) {
    const frameworks = techs.filter(t => t.layer === "framework");
    for (const fw of frameworks) {
      const lang = FRAMEWORK_LANGUAGE_MAP[fw.name];
      if (lang) {
        primaryLanguage = lang;
        break;
      }
    }
  }

  // Fall back to pipeline's tech stack
  if (!primaryLanguage && parsed.techStack.language) {
    primaryLanguage = parsed.techStack.language;
  }

  // 5. Compute complexity from unique layer count
  const uniqueLayers = new Set(techs.map(t => t.layer));
  let complexity: TechStackProfile["complexity"];
  if (uniqueLayers.size <= 2) complexity = "minimal";
  else if (uniqueLayers.size <= 4) complexity = "standard";
  else if (uniqueLayers.size <= 6) complexity = "complex";
  else complexity = "enterprise";

  return { parsed, intent, entities, techs, primaryLanguage, complexity };
}
