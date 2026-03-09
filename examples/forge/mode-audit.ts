/**
 * forge/mode-audit.ts — Audit existing skills for quality.
 */

import { success, emit, toErrorMessage } from "../../lib/output.js";
import {
  testAllSkillsSync,
  printQualityReport,
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

  const avgTrigger = results.reduce((s, r) => s + r.triggerScore, 0) / results.length;
  const avgQuality = results.reduce((s, r) => s + r.qualityScore, 0) / results.length;
  log(`  Summary:`);
  log(`    Total:       ${results.length}`);
  log(`    Passed:      ${passed} (${((passed / results.length) * 100).toFixed(0)}%)`);
  log(`    Avg trigger: ${avgTrigger.toFixed(2)}`);
  log(`    Avg quality: ${avgQuality.toFixed(1)}/10`);
  log(`    Domains:     ${grouped.size}`);
  log("");

  if (jsonMode) {
    const passingNames = new Set(results.filter(r => r.passed).map(r => r.name));
    const domains: Record<string, { total: number; passed: number }> = {};
    for (const [d, items] of grouped) {
      domains[d] = { total: items.length, passed: items.filter(e => passingNames.has(e.name)).length };
    }
    const aiMap = aiScores ? new Map(aiScores.map(a => [a.name, a.score])) : null;
    emit(success("skill-forge:audit", {
      total: results.length,
      passed,
      failed,
      avgTriggerScore: avgTrigger,
      avgQualityScore: avgQuality,
      domains,
      results: results.map(r => ({
        name: r.name,
        passed: r.passed,
        triggerScore: r.triggerScore,
        qualityScore: r.qualityScore,
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
