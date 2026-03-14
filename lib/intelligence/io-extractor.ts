/**
 * Skill IO type extraction via regex patterns.
 *
 * Extracts input/output types from SKILL.md content and CLI commands
 * to enable IO-chain graph edges (A outputs type X, B inputs type X).
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface IOProfile {
  inputs: IOEntry[];
  outputs: IOEntry[];
  sideEffects: string[];
  categories: string[];
}

export interface IOEntry {
  name: string;
  type: IOType;
  source: "flag" | "description" | "command";
}

export type IOType =
  | "file"
  | "directory"
  | "url"
  | "stdin"
  | "stdout"
  | "json"
  | "yaml"
  | "csv"
  | "image"
  | "binary"
  | "python-file"
  | "javascript-file"
  | "config-file"
  | "lint-report"
  | "test-report"
  | "coverage-report"
  | "docker-image"
  | "git-repo"
  | "database"
  | "api-endpoint"
  | "log-output"
  | "markdown"
  | "html"
  | "text";

// ── Pattern maps ───────────────────────────────────────────────────────

const INPUT_PATTERNS: Array<[RegExp, IOType]> = [
  [/--input\s+\S+/i, "file"],
  [/--file\s+\S+/i, "file"],
  [/--config\s+\S+/i, "config-file"],
  [/--src\s+\S+/i, "file"],
  [/--source\s+\S+/i, "file"],
  [/--url\s+\S+/i, "url"],
  [/--dir\s+\S+/i, "directory"],
  [/--directory\s+\S+/i, "directory"],
  [/--path\s+\S+/i, "file"],
  [/--image\s+\S+/i, "image"],
  [/--db\s+\S+/i, "database"],
  [/--database\s+\S+/i, "database"],
  [/reads?\s+(from\s+)?(files?|directories?|stdin)/i, "file"],
  [/accepts?\s+(files?|input)/i, "file"],
  [/parses?\s+(JSON|YAML|CSV|XML)/i, "json"],
  [/\.py\b/i, "python-file"],
  [/\.js\b|\.ts\b/i, "javascript-file"],
  [/\.json\b/i, "json"],
  [/\.ya?ml\b/i, "yaml"],
  [/\.csv\b/i, "csv"],
  [/\.md\b/i, "markdown"],
  [/\.html?\b/i, "html"],
];

const OUTPUT_PATTERNS: Array<[RegExp, IOType]> = [
  [/--output\s+\S+/i, "file"],
  [/--out\s+\S+/i, "file"],
  [/--dest\s+\S+/i, "file"],
  [/--target\s+\S+/i, "file"],
  [/--report\s+\S+/i, "lint-report"],
  [/generates?\s+(files?|output|report)/i, "file"],
  [/writes?\s+(to\s+)?(files?|stdout|disk)/i, "file"],
  [/produces?\s+(JSON|YAML|CSV|output)/i, "json"],
  [/outputs?\s+(to\s+)?(stdout|terminal|console)/i, "stdout"],
  [/creates?\s+(files?|directories?)/i, "file"],
  [/builds?\s+(docker\s+)?images?/i, "docker-image"],
  [/coverage\s+report/i, "coverage-report"],
  [/test\s+report/i, "test-report"],
  [/lint(ing)?\s+report/i, "lint-report"],
  [/log(s|ging)?\s+(output|file)/i, "log-output"],
];

const SIDE_EFFECT_PATTERNS: RegExp[] = [
  /modifies?\s+(files?|databases?|state)/i,
  /deletes?\s+(files?|directories?)/i,
  /sends?\s+(emails?|notifications?|webhooks?|requests?)/i,
  /deploys?\s/i,
  /pushes?\s/i,
  /publishes?\s/i,
  /installs?\s/i,
];

const CATEGORY_PATTERNS: Array<[RegExp, string]> = [
  [/lint(er|ing)?|check|format/i, "code-quality"],
  [/test(ing)?|spec|assert/i, "testing"],
  [/build|compile|bundle/i, "build"],
  [/deploy|release|publish/i, "deployment"],
  [/scan|audit|vulnerab/i, "security"],
  [/monitor|alert|metric/i, "observability"],
  [/docker|container|k8s/i, "containers"],
  [/git|version|commit/i, "vcs"],
  [/database|sql|query/i, "data"],
  [/api|http|rest|graphql/i, "api"],
  [/ml|model|train|infer/i, "ml"],
  [/image|video|audio|media/i, "media"],
];

// ── Extraction ─────────────────────────────────────────────────────────

/**
 * Extract IO profile from a SKILL.md content and optional CLI commands.
 */
export function extractIOProfile(
  skillMd: string,
  commands?: Array<{ name: string; description: string; flags?: Array<{ name: string; description: string }> }>,
): IOProfile {
  const inputs: IOEntry[] = [];
  const outputs: IOEntry[] = [];
  const sideEffects: string[] = [];
  const categories: string[] = [];

  const seen = new Set<string>();

  // Extract from skill description
  for (const [pattern, type] of INPUT_PATTERNS) {
    if (pattern.test(skillMd)) {
      const key = `input:${type}`;
      if (!seen.has(key)) {
        seen.add(key);
        inputs.push({ name: type, type, source: "description" });
      }
    }
  }

  for (const [pattern, type] of OUTPUT_PATTERNS) {
    if (pattern.test(skillMd)) {
      const key = `output:${type}`;
      if (!seen.has(key)) {
        seen.add(key);
        outputs.push({ name: type, type, source: "description" });
      }
    }
  }

  // Extract from command flags
  if (commands) {
    for (const cmd of commands) {
      for (const flag of cmd.flags ?? []) {
        const flagText = `${flag.name} ${flag.description}`;

        for (const [pattern, type] of INPUT_PATTERNS) {
          if (pattern.test(flagText)) {
            const key = `input:${flag.name}:${type}`;
            if (!seen.has(key)) {
              seen.add(key);
              inputs.push({ name: flag.name, type, source: "flag" });
            }
          }
        }

        for (const [pattern, type] of OUTPUT_PATTERNS) {
          if (pattern.test(flagText)) {
            const key = `output:${flag.name}:${type}`;
            if (!seen.has(key)) {
              seen.add(key);
              outputs.push({ name: flag.name, type, source: "flag" });
            }
          }
        }
      }
    }
  }

  // Extract side effects
  for (const pattern of SIDE_EFFECT_PATTERNS) {
    const match = skillMd.match(pattern);
    if (match) {
      sideEffects.push(match[0]!);
    }
  }

  // Categorize
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(skillMd)) {
      if (!categories.includes(category)) {
        categories.push(category);
      }
    }
  }

  return { inputs, outputs, sideEffects, categories };
}

/**
 * Check if two IO profiles are compatible (A's output matches B's input).
 */
export function isIOCompatible(producer: IOProfile, consumer: IOProfile): boolean {
  const producerTypes = new Set(producer.outputs.map((o) => o.type));
  return consumer.inputs.some((i) => producerTypes.has(i.type));
}
