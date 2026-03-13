/**
 * forge/mode-benchmark.ts — Comprehensive benchmark runner.
 *
 * Measures: trigger scores, quality scores, compliance %, hook coverage %,
 * agent coverage %, generation time, script validity.
 */

import { resolve } from "node:path";
import { readdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import type { CliArgs } from "./types.js";
import { log } from "./helpers.js";
import { auditAllPlugins } from "../../lib/plugin/audit-report.js";
import { testAllSkillsSync } from "../../lib/skill-tester.js";

interface BenchmarkResult {
  timestamp: string;
  skills: {
    total: number;
    avgTriggerScore: number;
    avgQualityScore: number;
    passRate: number;
    belowThreshold: number;
  };
  plugins: {
    total: number;
    avgComplianceScore: number;
    passRate: number;
    totalSkills: number;
    totalAgents: number;
    totalHooks: number;
    totalCommands: number;
    hookCoveragePercent: number;
    agentCoveragePercent: number;
  };
}

export async function runBenchmarkMode(opts: CliArgs): Promise<void> {
  const startTime = Date.now();
  log("Running comprehensive benchmark...\n");

  const skillsDir = opts.outputDir
    ? resolve(opts.outputDir, "generated-skills")
    : resolve("examples/generated-skills");
  const pluginsDir = opts.outputDir
    ? resolve(opts.outputDir, "plugins")
    : resolve("examples/plugins");

  // 1. Skill quality benchmark
  log("1. Skill quality analysis...");
  let skillResults = { total: 0, avgTriggerScore: 0, avgQualityScore: 0, passRate: 0, belowThreshold: 0 };

  if (existsSync(skillsDir)) {
    const results = testAllSkillsSync(skillsDir, opts.domain || undefined);
    const total = results.length;
    if (total > 0) {
      const avgTrigger = results.reduce((s, r) => s + r.triggerScore, 0) / total;
      const avgQuality = results.reduce((s, r) => s + r.qualityScore, 0) / total;
      const passed = results.filter(r => r.passed).length;
      const belowThreshold = results.filter(r => r.triggerScore < 0.80).length;
      skillResults = {
        total,
        avgTriggerScore: Math.round(avgTrigger * 1000) / 1000,
        avgQualityScore: Math.round(avgQuality * 10) / 10,
        passRate: Math.round((passed / total) * 100),
        belowThreshold,
      };
    }
    log(`   ${skillResults.total} skills, avg trigger ${skillResults.avgTriggerScore}, avg quality ${skillResults.avgQualityScore}, ${skillResults.passRate}% pass`);
  } else {
    log(`   No skills found at ${skillsDir}`);
  }

  // 2. Plugin compliance benchmark
  log("2. Plugin compliance analysis...");
  let pluginResults = { total: 0, avgComplianceScore: 0, passRate: 0, totalSkills: 0, totalAgents: 0, totalHooks: 0, totalCommands: 0, hookCoveragePercent: 0, agentCoveragePercent: 0 };

  if (existsSync(pluginsDir)) {
    const summary = auditAllPlugins(pluginsDir);
    if (summary.totalPlugins > 0) {
      const hookCoverage = Math.round((summary.results.filter(r => r.hookCount > 0).length / summary.totalPlugins) * 100);
      const agentCoverage = Math.round((summary.results.filter(r => r.agentCount > 1).length / summary.totalPlugins) * 100);
      pluginResults = {
        total: summary.totalPlugins,
        avgComplianceScore: summary.averageScore,
        passRate: Math.round((summary.passedPlugins / summary.totalPlugins) * 100),
        totalSkills: summary.totalSkills,
        totalAgents: summary.totalAgents,
        totalHooks: summary.totalHooks,
        totalCommands: summary.totalCommands,
        hookCoveragePercent: hookCoverage,
        agentCoveragePercent: agentCoverage,
      };
    }
    log(`   ${pluginResults.total} plugins, avg compliance ${pluginResults.avgComplianceScore}%, ${pluginResults.passRate}% pass`);
    log(`   Hook coverage: ${pluginResults.hookCoveragePercent}%, Agent coverage: ${pluginResults.agentCoveragePercent}%`);
  } else {
    log(`   No plugins found at ${pluginsDir}`);
  }

  const duration = Date.now() - startTime;
  log(`\nBenchmark completed in ${(duration / 1000).toFixed(1)}s`);

  const benchmark: BenchmarkResult = {
    timestamp: new Date().toISOString(),
    skills: skillResults,
    plugins: pluginResults,
  };

  if (opts.json) {
    const json = JSON.stringify(benchmark, null, 2);
    if (opts.out) {
      writeFileSync(opts.out, json, "utf-8");
      log(`JSON output written to: ${opts.out}`);
    } else {
      console.log(json);
    }
  } else {
    log("\n=== Benchmark Summary ===");
    log(`Skills: ${benchmark.skills.total} total, ${benchmark.skills.passRate}% pass`);
    log(`  Trigger: ${benchmark.skills.avgTriggerScore} avg, ${benchmark.skills.belowThreshold} below 0.80`);
    log(`  Quality: ${benchmark.skills.avgQualityScore}/10 avg`);
    log(`Plugins: ${benchmark.plugins.total} total, ${benchmark.plugins.passRate}% pass`);
    log(`  Compliance: ${benchmark.plugins.avgComplianceScore}% avg`);
    log(`  Hooks: ${benchmark.plugins.totalHooks} (${benchmark.plugins.hookCoveragePercent}% coverage)`);
    log(`  Agents: ${benchmark.plugins.totalAgents} (${benchmark.plugins.agentCoveragePercent}% multi-agent)`);
    log(`  Commands: ${benchmark.plugins.totalCommands}`);
  }
}
