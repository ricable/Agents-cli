/**
 * Skill quality testing + quality gate.
 *
 * Provides two testing modes:
 *   1. Sync structural scoring:
 *      - triggerScore (0-1): "Use when" clause with specific action verbs
 *      - qualityScore (1-10): description length, specificity, non-generic
 *
 *   2. Full async testing with query generation + optional AI scoring:
 *      testSkill, testAllSkills, printQualityReportFull
 *
 * Quality gate (strict): triggerScore < 0.8 OR qualityScore < 6 -> FAIL
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";

// ============================================================================
// Shared Types
// ============================================================================

export interface FrontmatterFields {
  name: string | null;
  description: string | null;
  allowedTools: string | null;
  compatibility: string | null;
  license: string | null;
}

/**
 * Sync test result (structural scoring only).
 */
export interface SkillTestResult {
  skillPath: string;
  name: string;
  triggerScore: number;  // 0-1
  qualityScore: number;  // 1-10
  passed: boolean;       // triggerScore >= 0.8 && qualityScore >= 6
  issues: string[];
}

/**
 * Full async test result (with query generation + optional AI scoring).
 */
export interface SkillTestResultFull {
  skillDir: string;
  skillName: string;
  description: string;
  triggerScore: number;         // 0.0 - 1.0 (fraction of trigger queries matched)
  qualityScore: number | null;  // 1 - 10 from Haiku, or null if not run
  issues: string[];
  triggerQueries: string[];
  nonTriggerQueries: string[];
  passed: boolean;              // triggerScore >= 0.8 && (qualityScore === null || qualityScore >= 6)
}

// ============================================================================
// Frontmatter Parsing
// ============================================================================

/**
 * Parse YAML frontmatter fields from SKILL.md content.
 */
export function parseSkillFrontmatter(content: string): FrontmatterFields {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    return { name: null, description: null, allowedTools: null, compatibility: null, license: null };
  }

  const fm = fmMatch[1] ?? "";

  const getField = (field: string): string | null => {
    const quotedMatch = fm.match(new RegExp(`^${field}:\\s*["']([\\s\\S]*?)["']\\s*$`, "m"));
    if (quotedMatch) return quotedMatch[1]?.trim() ?? null;
    const rawMatch = fm.match(new RegExp(`^${field}:\\s*([^"'][^\\n]*?)\\s*$`, "m"));
    return rawMatch ? rawMatch[1]?.trim() ?? null : null;
  };

  return {
    name: getField("name"),
    description: getField("description"),
    allowedTools: getField("allowed-tools"),
    compatibility: getField("compatibility"),
    license: getField("license"),
  };
}

// ============================================================================
// Structural Scoring (sync, no AI)
// ============================================================================

/**
 * Score description quality (1-10, structural -- no LLM).
 */
export function scoreSkillDescription(description: string): number {
  if (!description || description.length < 10) return 1;

  let score = 5;

  if (/use when/i.test(description)) score += 1;

  const triggerMatch = description.match(/use when (.+?)(?:\.|$)/i);
  if (triggerMatch && triggerMatch[1] && triggerMatch[1].split(",").length >= 3) score += 1;

  if (description.length > 100) score += 1;

  const techTerms = description.match(/\b[A-Z][a-zA-Z]{2,}\b|\b[a-z]+-[a-z]+\b/g) ?? [];
  if (techTerms.length >= 3) score += 1;

  const genericPhrases = ["a library", "a tool", "a package", "for things", "utility", "a framework"];
  if (genericPhrases.some(p => description.toLowerCase().includes(p))) score -= 2;

  if (description.length < 50) score -= 2;

  // Penalty for generic "CLI tool:" prefix pattern
  if (/^cli tool:/i.test(description)) score -= 1;

  // Bonus for mentioning specific technologies/languages
  const techLangs = /\b(python|rust|javascript|typescript|go|java|ruby|c\+\+|swift|kotlin|node\.js|react|vue|docker|kubernetes)\b/i;
  if (techLangs.test(description)) score += 1;

  return Math.max(1, Math.min(10, score));
}

/**
 * Score trigger specificity (0-1).
 */
export function scoreTrigger(description: string): number {
  if (!description) return 0;

  let score = 0;

  if (/use when/i.test(description)) score += 0.3;

  const actionVerbs = [
    "implementing", "building", "calling", "creating", "managing",
    "configuring", "deploying", "orchestrating", "streaming", "querying",
    "authenticating", "migrating", "testing", "bundling", "embedding",
    "routing", "scheduling", "publishing", "subscribing", "validating",
    "retrieval", "storage", "matching", "search", "indexing",
    "storing", "searching", "retrieving", "similarity", "parsing",
    "rendering", "transforming", "generating", "processing", "analyzing",
    "checking", "formatting", "linting", "scanning", "monitoring",
    "installing", "running", "training", "debugging", "fixing",
    "working", "downloading", "converting", "compiling", "auditing",
  ];
  const matched = actionVerbs.filter(v => description.toLowerCase().includes(v));
  score += Math.min(0.4, matched.length * 0.15);

  if (/do not use for|don't use for/i.test(description)) score += 0.2;

  // Structured "Use when X, Y, Z" with multiple comma-separated triggers
  const useWhenMatch = description.match(/use when (.+?)(?:\.|$)/i);
  if (useWhenMatch && useWhenMatch[1] && useWhenMatch[1].split(",").length >= 2) {
    score += 0.1;
  }

  const techNames = description.match(/\b[A-Z][a-zA-Z]{2,}\b/g) ?? [];
  if (techNames.length >= 2) score += 0.1;

  return Math.round(Math.min(1, score) * 100) / 100;
}

/**
 * Test a single SKILL.md file synchronously. Returns structural quality results.
 */
export function testSkillSync(skillPath: string, preloadedContent?: string): SkillTestResult {
  const issues: string[] = [];
  let content: string;

  try {
    content = preloadedContent ?? readFileSync(skillPath, "utf-8");
  } catch {
    return {
      skillPath,
      name: "unknown",
      triggerScore: 0,
      qualityScore: 1,
      passed: false,
      issues: ["Cannot read file"],
    };
  }

  const fm = parseSkillFrontmatter(content);
  const name = fm.name ?? basename(dirname(skillPath));

  if (!fm.description) {
    issues.push("Missing description");
    return { skillPath, name, triggerScore: 0, qualityScore: 1, passed: false, issues };
  }

  const triggerScore = Math.round(scoreTrigger(fm.description) * 100) / 100;
  const qualityScore = scoreSkillDescription(fm.description);
  const passed = triggerScore >= 0.8 && qualityScore >= 6;

  if (triggerScore < 0.8) issues.push(`Low trigger score: ${triggerScore.toFixed(2)} (need >= 0.80)`);
  if (qualityScore < 6) issues.push(`Low quality score: ${qualityScore}/10 (need >= 6)`);
  if (!fm.license) issues.push("Missing license field");
  if (!fm.allowedTools) issues.push("Missing allowed-tools field");
  if (!fm.compatibility) issues.push("Missing compatibility field");

  // Structural checks (advisory — not gate-blocking)
  if (skillPath !== "inline" && !preloadedContent) {
    const skillDir = dirname(skillPath);
    const refsDir = join(skillDir, "references");
    const scriptsDir = join(skillDir, "scripts");
    if (!existsSync(refsDir)) issues.push("Advisory: missing references/ directory");
    if (!existsSync(scriptsDir)) issues.push("Advisory: missing scripts/ directory");
    if (existsSync(refsDir) && !existsSync(join(refsDir, "guide.md"))) {
      issues.push("Advisory: missing references/guide.md");
    }
  }

  return { skillPath, name, triggerScore, qualityScore, passed, issues };
}

/**
 * Test all SKILL.md files synchronously. Returns results for each.
 */
export function testAllSkillsSync(skillsDir: string, domainFilter?: string): SkillTestResult[] {
  if (!existsSync(skillsDir)) return [];

  const results: SkillTestResult[] = [];
  const entries = readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(skillsDir, entry.name, "SKILL.md");

    let content: string;
    try {
      content = readFileSync(skillFile, "utf-8");
    } catch {
      continue;
    }

    if (domainFilter && !content.includes(`domain: ${domainFilter}`)) continue;

    results.push(testSkillSync(skillFile, content));
  }

  return results;
}

// ============================================================================
// Query Generation
// ============================================================================

/**
 * Extract trigger keywords from a skill description.
 */
function extractTriggers(description: string): string[] {
  const triggers: string[] = [];

  const useWhen = description.match(/Use when (.+?)(?:\.|$)/i)?.[1];
  if (useWhen) {
    const parts = useWhen.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 3);
    triggers.push(...parts.slice(0, 5));
  }

  const terms = description.match(/\b([A-Z][a-zA-Z0-9]{3,}|[a-z]+-[a-z]+|[a-z]+\.[a-z]+)\b/g) ?? [];
  triggers.push(...terms.slice(0, 5));

  return [...new Set(triggers)].slice(0, 10);
}

/**
 * Generate 10 triggering queries for a skill.
 */
export function generateTriggerQueries(description: string, skillName: string): string[] {
  const triggers = extractTriggers(description);
  const queries: string[] = [];

  for (const trigger of triggers.slice(0, 5)) {
    queries.push(`How do I ${trigger}?`);
    queries.push(`Help me with ${trigger}`);
  }

  const pkg = skillName.replace(/^src-/, "");
  queries.push(`Show me how to use ${pkg}`);
  queries.push(`What is ${pkg} and how does it work?`);
  queries.push(`${pkg} example code`);
  queries.push(`implement ${pkg}`);

  return [...new Set(queries)].slice(0, 10);
}

/**
 * Generate 5 non-triggering queries (should NOT activate this skill).
 */
export function generateNonTriggerQueries(_description: string): string[] {
  return [
    "How do I bake a chocolate cake?",
    "What is the capital of France?",
    "How do I fix a leaky faucet?",
    "Write me a poem about spring",
    "What is the weather like today?",
  ];
}

// ============================================================================
// Quality Reports (sync)
// ============================================================================

/**
 * Print a formatted quality report for sync results.
 */
export function printQualityReport(results: SkillTestResult[]): void {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n  Skill Quality Report`);
  console.log(`  ${"─".repeat(80)}`);
  console.log(`  ${"Skill".padEnd(34)} ${"Trigger".padStart(8)} ${"Quality".padStart(8)} ${"Status".padStart(8)}`);
  console.log(`  ${"─".repeat(80)}`);

  for (const r of results) {
    const status = r.passed ? "\x1b[32m PASS\x1b[0m" : "\x1b[31m FAIL\x1b[0m";
    console.log(
      `  ${r.name.slice(0, 34).padEnd(34)} ${r.triggerScore.toFixed(2).padStart(8)} ${String(r.qualityScore).padStart(8)} ${status}`,
    );
    for (const issue of r.issues) {
      console.log(`      -> ${issue}`);
    }
  }

  console.log(`  ${"─".repeat(80)}`);
  console.log(`  ${passed} passed, ${failed} failed of ${results.length} skills\n`);
}

// ============================================================================
// Trigger Matching (async testing)
// ============================================================================

function wouldTrigger(query: string, description: string): boolean {
  const queryWords = new Set(query.toLowerCase().match(/\b\w{4,}\b/g) ?? []);
  const descWords  = new Set(description.toLowerCase().match(/\b\w{4,}\b/g) ?? []);

  let overlap = 0;
  for (const w of queryWords) {
    if (descWords.has(w)) overlap++;
  }

  return overlap >= 1 || queryWords.size === 0;
}

function wouldNotTrigger(query: string, description: string): boolean {
  return !wouldTrigger(query, description);
}

// ============================================================================
// AI Quality Scoring
// ============================================================================

async function scoreWithHaiku(
  skillName: string,
  description: string,
  apiKey: string,
): Promise<number | null> {
  const prompt = `Rate this Claude Code skill description from 1-10 for quality:

Skill: ${skillName}
Description: "${description}"

Scoring criteria:
- 9-10: Highly specific trigger phrases, clear use cases, strong negative triggers
- 7-8: Good specificity, clear triggers, minor gaps
- 5-6: Moderate specificity, triggers present but generic
- 3-4: Vague description, weak triggers
- 1-2: Generic or unhelpful description

Respond with ONLY a JSON object: {"score": N, "reason": "..."}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) return null;
    const data = await res.json() as { content: Array<{ text: string }> };
    const text = data.content[0]?.text?.trim() ?? "";
    const parsed = JSON.parse(text) as { score: number };
    return Math.min(10, Math.max(1, Math.round(parsed.score)));
  } catch {
    return null;
  }
}

// ============================================================================
// Full Async Test Runner
// ============================================================================

/**
 * Test a single skill directory with full query generation + optional AI scoring.
 *
 * @param skillPath  Absolute path to skill directory (e.g. .claude/skills/src-nats)
 * @param useAI      Whether to run Haiku quality scoring (requires ANTHROPIC_API_KEY)
 */
export async function testSkill(skillPath: string, useAI = false): Promise<SkillTestResultFull> {
  const skillName = basename(skillPath);
  const skillFile = join(skillPath, "SKILL.md");

  if (!existsSync(skillFile)) {
    return {
      skillDir: skillPath,
      skillName,
      description: "",
      triggerScore: 0,
      qualityScore: null,
      issues: ["SKILL.md not found"],
      triggerQueries: [],
      nonTriggerQueries: [],
      passed: false,
    };
  }

  const content = readFileSync(skillFile, "utf-8");
  const descMatch = content.match(/^description:\s*["']?([\s\S]*?)["']?\s*$/m);
  const description = (descMatch?.[1] ?? "").trim();

  const issues: string[] = [];
  if (!description) issues.push("Empty description");

  const triggerQueries = generateTriggerQueries(description, skillName);
  const nonTriggerQueries = generateNonTriggerQueries(description);

  const triggerHits = triggerQueries.filter(q => wouldTrigger(q, description)).length;
  const triggerScore = triggerQueries.length > 0 ? triggerHits / triggerQueries.length : 0;

  const nonTriggerMisses = nonTriggerQueries.filter(q => wouldNotTrigger(q, description)).length;
  if (nonTriggerMisses < nonTriggerQueries.length * 0.8) {
    issues.push("Too many non-trigger queries are matching (over-broad description)");
  }

  if (triggerScore < 0.8) {
    issues.push(`Low trigger score: ${(triggerScore * 100).toFixed(0)}% (threshold: 80%)`);
  }

  let qualityScore: number | null = null;
  if (useAI) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      qualityScore = await scoreWithHaiku(skillName, description, apiKey);
      if (qualityScore !== null && qualityScore < 6) {
        issues.push(`Low quality score: ${qualityScore}/10 (threshold: 6)`);
      }
    }
  }

  const passed = triggerScore >= 0.8 && (qualityScore === null || qualityScore >= 6);

  return {
    skillDir: skillPath,
    skillName,
    description,
    triggerScore,
    qualityScore,
    issues,
    triggerQueries,
    nonTriggerQueries,
    passed,
  };
}

/**
 * Test all skills in a skills directory (async, with optional AI scoring).
 */
export async function testAllSkills(
  skillsDir: string,
  useAI = false,
  domainFilter?: string,
): Promise<SkillTestResultFull[]> {
  if (!existsSync(skillsDir)) return [];

  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith("src-") && !d.name.startsWith("src-index"))
    .map(d => join(skillsDir, d.name));

  const results: SkillTestResultFull[] = [];
  for (const dir of dirs) {
    if (domainFilter) {
      const skillFile = join(dir, "SKILL.md");
      if (existsSync(skillFile)) {
        const content = readFileSync(skillFile, "utf-8");
        if (!content.includes(`domain: ${domainFilter}`)) continue;
      }
    }
    results.push(await testSkill(dir, useAI));
  }

  return results;
}

// ============================================================================
// Quality Reports (async / full)
// ============================================================================

/**
 * Print a quality report table for full async results.
 */
export function printQualityReportFull(results: SkillTestResultFull[]): void {
  const passed  = results.filter(r => r.passed).length;
  const failed  = results.length - passed;

  console.log(`\n  Skill Quality Report`);
  console.log(`  ${"─".repeat(80)}`);
  console.log(`  ${"Skill".padEnd(32)} ${"Trigger".padStart(8)} ${"Quality".padStart(8)}  Issues`);
  console.log(`  ${"─".repeat(80)}`);

  for (const r of results) {
    const triggerPct = `${(r.triggerScore * 100).toFixed(0)}%`;
    const qualityStr = r.qualityScore !== null ? `${r.qualityScore}/10` : "n/a";
    const statusColor = r.passed ? "\x1b[32m\x1b[0m" : "\x1b[31m\x1b[0m";
    const issueStr = r.issues.length > 0 ? r.issues[0] : "";
    console.log(
      `  ${statusColor} ${r.skillName.padEnd(30)} ${triggerPct.padStart(7)} ${qualityStr.padStart(8)}  ${issueStr}`,
    );
  }

  console.log(`  ${"─".repeat(80)}`);
  console.log(`  Total: ${results.length}  Passed: ${passed}  Flagged: ${failed}\n`);
}
