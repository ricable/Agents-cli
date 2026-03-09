/**
 * forge/mode-audit.ts — Audit existing skills for quality.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { success, emit, toErrorMessage } from "../../lib/output.js";
import {
  testAllSkillsSync,
  printQualityReport,
  scoreContentQuality,
} from "../../lib/skill-tester.js";
import { groupByDomain } from "../../lib/indexes.js";
import { DOMAIN_TRIGGERS } from "../../lib/domains.js";
import type { CliArgs } from "./types.js";
import { OUTPUT_DIR } from "./types.js";
import { log, scanSkillEntries } from "./helpers.js";

interface AuditOpts { strict: boolean; json: boolean; domain: string; ai: boolean }

export async function auditMode(args: CliArgs, startTime: number): Promise<void> {
  const opts: AuditOpts = { strict: args.strict, json: args.json, domain: args.domain, ai: args.ai };
  const { strict, json: jsonMode, domain, ai } = opts;

  log("\n  Skill Quality Audit");
  log(`  Directory: ${OUTPUT_DIR}`);
  if (domain) log(`  Domain:    ${domain}`);
  if (ai) log(`  AI:        enabled (Haiku scoring)`);
  log("");

  const results = testAllSkillsSync(OUTPUT_DIR, domain || undefined);

  if (results.length === 0) {
    log("  No skills found to audit.");
    if (jsonMode) {
      emit(success("skill-forge:audit", { total: 0, passed: 0, failed: 0, results: [] }, startTime), true);
    }
    return;
  }

  const entries = scanSkillEntries(OUTPUT_DIR);
  const grouped = groupByDomain(entries);

  printQualityReport(results);

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  log("  Domain Distribution:");
  for (const [d, items] of [...grouped].sort((a, b) => b[1].length - a[1].length)) {
    const count = String(items.length).padStart(4);
    const triggers = DOMAIN_TRIGGERS[d];
    const hint = triggers ? ` (${triggers.split(",").slice(0, 3).map(s => s.trim()).join(", ")})` : "";
    log(`    ${d.padEnd(20)} ${count} skills${hint}`);
  }
  log("");

  let aiScores: Array<{ name: string; score: number | null }> | null = null;
  if (ai) {
    log("  Running AI quality scoring...");
    try {
      const { testAllSkills } = await import("../../lib/skill-tester.js");
      const fullResults = await testAllSkills(OUTPUT_DIR, true, domain || undefined);
      aiScores = fullResults.map(r => ({
        name: r.skillName,
        score: r.qualityScore,
      }));
      const scored = aiScores.filter(a => a.score !== null);
      if (scored.length > 0) {
        const avg = scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length;
        log(`  AI Quality Scores (${scored.length} scored):`);
        log(`    Average: ${avg.toFixed(1)}/10`);
        const low = scored.filter(a => (a.score ?? 10) < 6);
        if (low.length > 0) {
          log(`    Below threshold: ${low.length}`);
          for (const a of low) log(`      - ${a.name}: ${a.score}/10`);
        }
        log("");
      }
    } catch (err) {
      log(`  AI scoring failed: ${toErrorMessage(err)}`);
    }
  }

  // Content quality scoring (advisory)
  const contentScores: Array<{ name: string; score: number; issues: string[] }> = [];
  for (const r of results) {
    const skillFile = join(OUTPUT_DIR, r.name, "SKILL.md");
    try {
      const content = readFileSync(skillFile, "utf-8");
      const cq = scoreContentQuality(content);
      contentScores.push({ name: r.name, score: cq.score, issues: cq.issues });
    } catch { /* skip unreadable */ }
  }
  const contentLow = contentScores.filter(c => c.score < 7);
  if (contentLow.length > 0) {
    log(`  Content Quality Issues (advisory, ${contentLow.length} below 7/10):`);
    for (const c of contentLow.slice(0, 10)) {
      log(`    ${c.name.padEnd(30)} ${c.score}/10  ${c.issues.join(", ")}`);
    }
    if (contentLow.length > 10) log(`    ... and ${contentLow.length - 10} more`);
    log("");
  }
  const avgContent = contentScores.length > 0
    ? contentScores.reduce((s, c) => s + c.score, 0) / contentScores.length
    : 0;

  const avgTrigger = results.reduce((s, r) => s + r.triggerScore, 0) / results.length;
  const avgQuality = results.reduce((s, r) => s + r.qualityScore, 0) / results.length;
  log(`  Summary:`);
  log(`    Total:       ${results.length}`);
  log(`    Passed:      ${passed} (${((passed / results.length) * 100).toFixed(0)}%)`);
  log(`    Avg trigger: ${avgTrigger.toFixed(2)}`);
  log(`    Avg quality: ${avgQuality.toFixed(1)}/10`);
  if (contentScores.length > 0) log(`    Avg content: ${avgContent.toFixed(1)}/10 (advisory)`);
  log(`    Domains:     ${grouped.size}`);
  log("");

  if (jsonMode) {
    const passingNames = new Set(results.filter(r => r.passed).map(r => r.name));
    const domains: Record<string, { total: number; passed: number }> = {};
    for (const [d, items] of grouped) {
      domains[d] = { total: items.length, passed: items.filter(e => passingNames.has(e.name)).length };
    }
    const aiMap = aiScores ? new Map(aiScores.map(a => [a.name, a.score])) : null;
    const contentMap = new Map(contentScores.map(c => [c.name, c]));
    emit(success("skill-forge:audit", {
      total: results.length,
      passed,
      failed,
      avgTriggerScore: avgTrigger,
      avgQualityScore: avgQuality,
      avgContentScore: avgContent,
      domains,
      results: results.map(r => ({
        name: r.name,
        passed: r.passed,
        triggerScore: r.triggerScore,
        qualityScore: r.qualityScore,
        contentScore: contentMap.get(r.name)?.score ?? null,
        contentIssues: contentMap.get(r.name)?.issues ?? [],
        issues: r.issues,
        aiScore: aiMap?.get(r.name) ?? null,
      })),
    }, startTime), true);
  }

  if (strict && failed > 0) {
    process.exitCode = 1;
    log(`  STRICT MODE: ${failed} skills failed quality gate.`);
  }
}
