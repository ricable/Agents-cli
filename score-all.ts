/**
 * score-all.ts — Quick skill quality scoring for all generated skills.
 *
 * Usage: npx tsx score-all.ts [--out <file>]
 */

import { testAllSkillsSync } from "./lib/skill-tester.js";

const SKILLS_DIR = "./examples/generated-skills";

const results = testAllSkillsSync(SKILLS_DIR);

if (results.length === 0) {
  console.log("No skills found in", SKILLS_DIR);
  process.exitCode = 1;
} else {
  const total = results.length;
  const passing = results.filter(r => r.passed).length;
  const avgTrigger = results.reduce((s, r) => s + r.triggerScore, 0) / total;
  const avgQuality = results.reduce((s, r) => s + r.qualityScore, 0) / total;
  const avgContent = results.reduce((s, r) => s + r.contentScore, 0) / total;
  const below080 = results.filter(r => r.triggerScore < 0.80).length;

  console.log(`Total skills: ${total}`);
  console.log(`Passing gate: ${passing}/${total} (${((passing / total) * 100).toFixed(1)}%)`);
  console.log(`Avg trigger score: ${avgTrigger.toFixed(3)}`);
  console.log(`Avg quality score: ${avgQuality.toFixed(1)}`);
  console.log(`Avg content score: ${avgContent.toFixed(1)}`);
  console.log(`Skills < 0.80 trigger: ${below080}`);

  // List failed skills
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log(`\nFailed skills (${failed.length}):`);
    for (const r of failed) {
      console.log(`  ${r.name}: trigger=${r.triggerScore} quality=${r.qualityScore} content=${r.contentScore}`);
      for (const issue of r.issues.filter(i => !i.startsWith("Advisory") && !i.startsWith("Content:"))) {
        console.log(`    - ${issue}`);
      }
    }
  }

  // Output JSON if --out flag provided
  const outIdx = process.argv.indexOf("--out");
  if (outIdx >= 0 && process.argv[outIdx + 1]) {
    const { writeFileSync } = await import("node:fs");
    const data = {
      total,
      passing,
      avgTrigger: Math.round(avgTrigger * 1000) / 1000,
      avgQuality: Math.round(avgQuality * 10) / 10,
      avgContent: Math.round(avgContent * 10) / 10,
      below080,
      failed: failed.map(r => ({ name: r.name, trigger: r.triggerScore, quality: r.qualityScore, content: r.contentScore })),
    };
    writeFileSync(process.argv[outIdx + 1]!, JSON.stringify(data, null, 2));
    console.log(`\nWrote scores to ${process.argv[outIdx + 1]}`);
  }
}
