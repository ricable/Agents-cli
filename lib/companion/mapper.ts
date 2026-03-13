/**
 * companion/mapper.ts — TechStackProfile → Tool Recommendations.
 *
 * Maps detected technologies to curated CLI tool recommendations.
 * Reuses loadAllTools() for enrichment.
 */

import { loadAllTools, type CliTool } from "../curated-tools.js";
import type { TechStackProfile, TechLayer, DetectedTech } from "./analyzer.js";

// ── Types ──────────────────────────────────────────────────────────────

export type ToolPriority = "essential" | "recommended" | "optional";

export interface ToolRecommendation {
  readonly source: string;
  readonly name: string;
  readonly reason: string;
  readonly priority: ToolPriority;
  readonly triggeredBy: string;
  readonly score: number;
  readonly category?: string;
}

export interface CompanionToolPlan {
  readonly recommendations: readonly ToolRecommendation[];
  readonly summary: { essential: number; recommended: number; optional: number; total: number };
  readonly domains: readonly string[];
  readonly profile: TechStackProfile;
}

// ── Static Mapping Tables ──────────────────────────────────────────────

interface ToolEntry {
  readonly source: string;
  readonly name: string;
  readonly reason: string;
  readonly priority: ToolPriority;
}

const LANGUAGE_TOOL_MAP: Readonly<Record<string, readonly ToolEntry[]>> = {
  python: [
    { source: "pypi:uv", name: "uv", reason: "Ultra-fast Python package manager and resolver", priority: "essential" },
    { source: "pypi:ruff", name: "ruff", reason: "Blazing fast Python linter and formatter", priority: "essential" },
    { source: "npm:pyright", name: "pyright", reason: "Fast static type checker for Python", priority: "recommended" },
    { source: "pypi:pytest", name: "pytest", reason: "Full-featured Python testing framework", priority: "recommended" },
  ],
  typescript: [
    { source: "npm:typescript", name: "tsc", reason: "TypeScript compiler and type checker", priority: "essential" },
    { source: "biomejs/biome", name: "biome", reason: "Fast linter+formatter for JS/TS", priority: "essential" },
    { source: "npm:tsx", name: "tsx", reason: "Run TypeScript directly without build step", priority: "recommended" },
    { source: "npm:vitest", name: "vitest", reason: "Fast Vite-native test runner", priority: "recommended" },
  ],
  javascript: [
    { source: "npm:eslint", name: "eslint", reason: "Pluggable JS/TS linter with JSON output", priority: "essential" },
    { source: "npm:prettier", name: "prettier", reason: "Opinionated code formatter", priority: "recommended" },
    { source: "npm:tsx", name: "tsx", reason: "Run TS/JS files directly", priority: "recommended" },
  ],
  rust: [
    { source: "crates:cargo-watch", name: "cargo-watch", reason: "Watch for changes and recompile", priority: "recommended" },
    { source: "crates:cargo-nextest", name: "cargo-nextest", reason: "Next-gen Rust test runner", priority: "recommended" },
    { source: "crates:cargo-deny", name: "cargo-deny", reason: "Lint dependencies for advisories and licenses", priority: "recommended" },
  ],
  golang: [
    { source: "pypi:golangci-lint", name: "golangci-lint", reason: "Fast Go linters aggregator", priority: "essential" },
    { source: "dominikh/go-tools", name: "staticcheck", reason: "Advanced Go static analysis", priority: "recommended" },
  ],
  java: [
    { source: "google/google-java-format", name: "google-java-format", reason: "Java code formatter", priority: "recommended" },
  ],
  ruby: [
    { source: "rubocop/rubocop", name: "rubocop", reason: "Ruby linter and formatter", priority: "essential" },
  ],
  php: [
    { source: "PHP-CS-Fixer/PHP-CS-Fixer", name: "php-cs-fixer", reason: "PHP code style fixer", priority: "recommended" },
  ],
  elixir: [
    { source: "rrrene/credo", name: "credo", reason: "Static analysis for Elixir", priority: "recommended" },
  ],
};

const DATABASE_TOOL_MAP: Readonly<Record<string, readonly ToolEntry[]>> = {
  postgresql: [
    { source: "pypi:pgcli", name: "pgcli", reason: "PostgreSQL CLI with auto-completion", priority: "recommended" },
    { source: "npm:prisma", name: "prisma", reason: "Type-safe ORM with migrations", priority: "recommended" },
  ],
  mysql: [
    { source: "pypi:mycli", name: "mycli", reason: "MySQL CLI with auto-completion", priority: "recommended" },
  ],
  mongodb: [
    { source: "npm:mongosh", name: "mongosh", reason: "MongoDB Shell with JS engine", priority: "recommended" },
  ],
  redis: [
    { source: "redis/redis", name: "redis-cli", reason: "Redis command-line interface", priority: "recommended" },
  ],
  supabase: [
    { source: "npm:supabase", name: "supabase", reason: "Supabase CLI for local dev and migrations", priority: "essential" },
  ],
  sqlite: [
    { source: "pypi:litecli", name: "litecli", reason: "SQLite CLI with auto-completion", priority: "optional" },
  ],
};

const INFRA_TOOL_MAP: Readonly<Record<string, readonly ToolEntry[]>> = {
  aws: [
    { source: "pypi:awscli", name: "aws", reason: "AWS CLI for cloud resource management", priority: "essential" },
    { source: "hashicorp/terraform", name: "terraform", reason: "Infrastructure as Code provisioning", priority: "recommended" },
    { source: "localstack/localstack-cli", name: "localstack", reason: "Local AWS emulation for testing", priority: "optional" },
  ],
  gcp: [
    { source: "google-cloud-sdk", name: "gcloud", reason: "Google Cloud CLI", priority: "essential" },
    { source: "hashicorp/terraform", name: "terraform", reason: "Infrastructure as Code provisioning", priority: "recommended" },
  ],
  azure: [
    { source: "npm:azure-cli", name: "az", reason: "Azure CLI for cloud management", priority: "essential" },
    { source: "hashicorp/terraform", name: "terraform", reason: "Infrastructure as Code provisioning", priority: "recommended" },
  ],
  docker: [
    { source: "moby/moby", name: "docker", reason: "Container runtime and management", priority: "essential" },
    { source: "docker/compose", name: "docker-compose", reason: "Multi-container orchestration", priority: "essential" },
    { source: "wagoodman/dive", name: "dive", reason: "Docker image layer analyzer", priority: "optional" },
  ],
  kubernetes: [
    { source: "kubernetes/kubectl", name: "kubectl", reason: "Kubernetes cluster management", priority: "essential" },
    { source: "helm/helm", name: "helm", reason: "Kubernetes package manager", priority: "recommended" },
    { source: "derailed/k9s", name: "k9s", reason: "Terminal UI for Kubernetes", priority: "optional" },
  ],
  terraform: [
    { source: "hashicorp/terraform", name: "terraform", reason: "Infrastructure as Code provisioning", priority: "essential" },
    { source: "terraform-linters/tflint", name: "tflint", reason: "Terraform linter", priority: "recommended" },
  ],
  vercel: [
    { source: "npm:vercel", name: "vercel", reason: "Vercel CLI for deployment", priority: "essential" },
  ],
  cloudflare: [
    { source: "npm:wrangler", name: "wrangler", reason: "Cloudflare Workers CLI", priority: "essential" },
  ],
  nginx: [
    { source: "nginx/nginx", name: "nginx", reason: "Web server and reverse proxy", priority: "essential" },
  ],
};

const FRAMEWORK_TOOL_MAP: Readonly<Record<string, readonly ToolEntry[]>> = {
  fastapi: [
    { source: "pypi:uvicorn", name: "uvicorn", reason: "ASGI server for FastAPI", priority: "essential" },
    { source: "pypi:httpie", name: "http", reason: "Human-friendly HTTP client for API testing", priority: "recommended" },
  ],
  django: [
    { source: "pypi:django-debug-toolbar", name: "django-debug-toolbar", reason: "Django debugging panel", priority: "optional" },
  ],
  nextjs: [
    { source: "npm:vercel", name: "vercel", reason: "Deploy Next.js with zero config", priority: "optional" },
  ],
  react: [
    { source: "microsoft/playwright", name: "playwright", reason: "E2E testing for React apps", priority: "recommended" },
  ],
};

const CICD_TOOL_MAP: Readonly<Record<string, readonly ToolEntry[]>> = {
  "github actions": [
    { source: "cli/cli", name: "gh", reason: "GitHub CLI for PR, issues, actions management", priority: "essential" },
    { source: "nektos/act", name: "act", reason: "Run GitHub Actions locally", priority: "recommended" },
  ],
  github: [
    { source: "cli/cli", name: "gh", reason: "GitHub CLI for PR, issues, actions management", priority: "essential" },
  ],
  "gitlab ci": [
    { source: "glab-io/glab", name: "glab", reason: "GitLab CLI for MR, issues, pipelines", priority: "essential" },
  ],
  "ci/cd": [
    { source: "cli/cli", name: "gh", reason: "GitHub CLI for CI workflow management", priority: "recommended" },
  ],
  "ci cd": [
    { source: "cli/cli", name: "gh", reason: "GitHub CLI for CI workflow management", priority: "recommended" },
  ],
};

const MESSAGING_TOOL_MAP: Readonly<Record<string, readonly ToolEntry[]>> = {
  kafka: [
    { source: "edenhill/kcat", name: "kcat", reason: "Kafka producer/consumer CLI", priority: "recommended" },
  ],
  rabbitmq: [
    { source: "rabbitmq/rabbitmq-server", name: "rabbitmqctl", reason: "RabbitMQ management CLI", priority: "recommended" },
  ],
};

const MONITORING_TOOL_MAP: Readonly<Record<string, readonly ToolEntry[]>> = {
  prometheus: [
    { source: "prometheus/prometheus", name: "promtool", reason: "Prometheus config validation and testing", priority: "recommended" },
  ],
  grafana: [
    { source: "grafana/grafana", name: "grafana-cli", reason: "Grafana plugin and server management", priority: "optional" },
  ],
};

const UNIVERSAL_TOOLS: readonly ToolEntry[] = [
  { source: "BurntSushi/ripgrep", name: "rg", reason: "Fast code search with structured JSON output", priority: "recommended" },
  { source: "sharkdp/fd", name: "fd", reason: "Fast file finder with regex/glob support", priority: "recommended" },
  { source: "jqlang/jq", name: "jq", reason: "JSON processing in CLI pipelines", priority: "recommended" },
  { source: "cli/cli", name: "gh", reason: "GitHub CLI for repository management", priority: "recommended" },
  { source: "gitleaks/gitleaks", name: "gitleaks", reason: "Prevent hardcoded secrets in commits", priority: "recommended" },
  { source: "sharkdp/hyperfine", name: "hyperfine", reason: "Command-line benchmarking tool", priority: "optional" },
  { source: "dandavison/delta", name: "delta", reason: "Better git diff viewer", priority: "optional" },
];

// ── Layer → Map dispatch ───────────────────────────────────────────────

const LAYER_MAPS: Partial<Record<TechLayer, Readonly<Record<string, readonly ToolEntry[]>>>> = {
  language: LANGUAGE_TOOL_MAP,
  database: DATABASE_TOOL_MAP,
  infra: INFRA_TOOL_MAP,
  framework: FRAMEWORK_TOOL_MAP,
  cicd: CICD_TOOL_MAP,
  messaging: MESSAGING_TOOL_MAP,
  monitoring: MONITORING_TOOL_MAP,
};

// ── Priority scoring ───────────────────────────────────────────────────

function computeScore(
  entry: ToolEntry,
  tech: DetectedTech,
  primaryLang: string | null,
): number {
  const basePriority = entry.priority === "essential" ? 80
    : entry.priority === "recommended" ? 50
    : 20;

  let bonus = 0;
  // Language match bonus
  if (primaryLang && tech.layer === "language" && tech.name === primaryLang) {
    bonus += 20;
  }
  // Tech-specific bonus (direct match is more valuable)
  if (tech.confidence >= 0.9) bonus += 10;

  return basePriority + bonus;
}

// ── Main Function ─────────────────────────────────────────────────────

/**
 * Map a TechStackProfile to prioritized CLI tool recommendations.
 */
export function mapToTools(profile: TechStackProfile, projectRoot: string): CompanionToolPlan {
  const recommendations: ToolRecommendation[] = [];
  const seen = new Set<string>();

  const addRec = (entry: ToolEntry, triggeredBy: string, score: number, category?: string): void => {
    if (seen.has(entry.source)) return;
    seen.add(entry.source);
    recommendations.push({
      source: entry.source,
      name: entry.name,
      reason: entry.reason,
      priority: entry.priority,
      triggeredBy,
      score,
      category,
    });
  };

  // 1. Map each detected tech to its tools
  for (const tech of profile.techs) {
    const map = LAYER_MAPS[tech.layer];
    if (!map) continue;
    const tools = map[tech.name];
    if (!tools) continue;

    const trigger = `${tech.layer}:${tech.name}`;
    for (const entry of tools) {
      const score = computeScore(entry, tech, profile.primaryLanguage);
      addRec(entry, trigger, score);
    }
  }

  // 1b. If primary language was inferred (not explicitly detected), add language tools too
  const hasExplicitLang = profile.techs.some(t => t.layer === "language");
  if (!hasExplicitLang && profile.primaryLanguage) {
    const langTools = LANGUAGE_TOOL_MAP[profile.primaryLanguage];
    if (langTools) {
      const trigger = `language:${profile.primaryLanguage}`;
      for (const entry of langTools) {
        const score = entry.priority === "essential" ? 100 : entry.priority === "recommended" ? 60 : 25;
        addRec(entry, trigger, score);
      }
    }
  }

  // 2. Add universal tools
  for (const entry of UNIVERSAL_TOOLS) {
    addRec(entry, "universal", entry.priority === "recommended" ? 40 : 15);
  }

  // 3. Enrich with curated tools metadata
  try {
    const curatedTools = loadAllTools(projectRoot);
    const curatedBySource = new Map<string, CliTool>();
    for (const ct of curatedTools) {
      curatedBySource.set(ct.source, ct);
      // Also index by name for partial matching
      curatedBySource.set(ct.name, ct);
    }

    // Enrich existing recommendations with category
    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i]!;
      const curated = curatedBySource.get(rec.source) ?? curatedBySource.get(rec.name);
      if (curated && !rec.category) {
        // Reconstruct with category
        recommendations[i] = { ...rec, category: curated.category };
      }
    }
  } catch {
    // loadAllTools may fail if curated registry is not available — that's fine
  }

  // 4. Sort by priority then score
  const priorityOrder: Record<ToolPriority, number> = { essential: 0, recommended: 1, optional: 2 };
  recommendations.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return b.score - a.score;
  });

  // 5. Build summary (single pass)
  const summary = { essential: 0, recommended: 0, optional: 0, total: recommendations.length };
  for (const r of recommendations) summary[r.priority]++;

  // 6. Collect unique domains
  const domains = [...new Set(profile.techs.map(t => t.layer))];

  return { recommendations, summary, domains, profile };
}
