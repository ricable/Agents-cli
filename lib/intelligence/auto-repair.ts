/**
 * Auto-repair: LLM-powered quality repair for skills that fail quality gates.
 *
 * When a skill fails trigger score (< 0.80) or quality gate,
 * uses Ollama to rewrite the description with proper triggers.
 * Up to 3 retries per skill.
 */

import type { TieredLLMClient } from "../composer/llm-client.js";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { toErrorMessage } from "../output.js";
import { scoreTrigger, testSkillSync } from "../skill-tester.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface RepairOptions {
  /** Maximum repair attempts per skill */
  maxRetries?: number;
  /** Minimum trigger score target (default: 0.80) */
  minTrigger?: number;
  /** Minimum quality score target (default: 6) */
  minQuality?: number;
}

export interface RepairResult {
  skillId: string;
  repaired: boolean;
  attempts: number;
  originalScore: number;
  finalScore: number;
  error?: string;
}

// ── Auto-repair ────────────────────────────────────────────────────────

const REPAIR_PROMPT = `You are a SKILL.md quality expert for the agents-cli system.

A skill description MUST contain:
1. "Use when" followed by 3+ action-verb clauses (comma-separated)
2. At least 3 action verbs from this list: install, configure, analyze, lint, format, test, run, build, deploy, scan, check, validate, generate, transform, compile, bundle, optimize, migrate, monitor, debug, profile, benchmark, serve, start, create, update, remove, manage, orchestrate, compose, automate
3. "Do NOT use for" with exclusion criteria
4. 2+ TechNames (capitalized technology names like Python, Docker, TypeScript)

Rewrite ONLY the description section (the text between the frontmatter and first ## heading).
Keep all frontmatter and other sections unchanged.

Current score: {score}
Target: >= {target}

Output ONLY the new description text, nothing else.`;

/**
 * Attempt to repair a skill's description to pass quality gates.
 */
export async function repairSkill(
  client: TieredLLMClient,
  skillDir: string,
  currentScore: number,
  opts?: RepairOptions,
): Promise<RepairResult> {
  const maxRetries = opts?.maxRetries ?? 3;
  const minTrigger = opts?.minTrigger ?? 0.80;
  const minQuality = opts?.minQuality ?? 6;
  const skillMdPath = join(skillDir, "SKILL.md");

  let originalContent: string;
  try {
    originalContent = readFileSync(skillMdPath, "utf-8");
  } catch {
    return {
      skillId: skillDir,
      repaired: false,
      attempts: 0,
      originalScore: currentScore,
      finalScore: currentScore,
      error: "SKILL.md not found",
    };
  }

  let content = originalContent;
  let score = currentScore;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (score >= minTrigger) break;

    try {
      const prompt = REPAIR_PROMPT
        .replace("{score}", score.toFixed(2))
        .replace("{target}", minTrigger.toFixed(2));

      const response = await client.generate("repair", `${prompt}\n\nCurrent SKILL.md:\n\n${content}`);

      // Replace description section
      const newDescription = response.content.trim();
      content = replaceDescription(content, newDescription);

      // Score the new content using direct import (not dynamic)
      score = scoreTrigger(newDescription);

      // Quality gate: trigger score AND quality score must both pass
      if (score >= minTrigger) {
        // Validate quality score via testSkillSync if available
        let qualityPasses = true;
        try {
          const testResult = testSkillSync("inline", content);
          qualityPasses = (testResult.qualityScore ?? 0) >= minQuality;
        } catch {
          // If quality check unavailable, accept trigger score alone
        }

        if (qualityPasses) {
          // Write repaired content
          writeFileSync(skillMdPath, content, "utf-8");
          return {
            skillId: skillDir,
            repaired: true,
            attempts: attempt,
            originalScore: currentScore,
            finalScore: score,
          };
        }
        // Quality didn't pass — continue retry loop
      }
    } catch (err) {
      return {
        skillId: skillDir,
        repaired: false,
        attempts: attempt,
        originalScore: currentScore,
        finalScore: score,
        error: toErrorMessage(err),
      };
    }
  }

  return {
    skillId: skillDir,
    repaired: false,
    attempts: maxRetries,
    originalScore: currentScore,
    finalScore: score,
  };
}

/**
 * Batch repair multiple skills.
 */
export async function repairBatch(
  client: TieredLLMClient,
  skills: Array<{ dir: string; score: number }>,
  opts?: RepairOptions,
): Promise<RepairResult[]> {
  const results: RepairResult[] = [];

  for (const skill of skills) {
    const result = await repairSkill(client, skill.dir, skill.score, opts);
    results.push(result);
  }

  return results;
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Replace the description section of a SKILL.md (between frontmatter and first ## heading).
 */
function replaceDescription(content: string, newDescription: string): string {
  // Find end of frontmatter
  const fmEnd = content.indexOf("---", content.indexOf("---") + 3);
  if (fmEnd === -1) return content;

  const afterFm = fmEnd + 3;

  // Find first ## heading
  const firstHeading = content.indexOf("\n## ", afterFm);
  if (firstHeading === -1) {
    // No headings — replace everything after frontmatter
    return content.slice(0, afterFm) + "\n\n" + newDescription + "\n";
  }

  return content.slice(0, afterFm) + "\n\n" + newDescription + "\n" + content.slice(firstHeading);
}
