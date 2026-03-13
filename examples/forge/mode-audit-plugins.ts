/**
 * forge/mode-audit-plugins.ts — Plugin compliance audit mode.
 *
 * Audits all built plugins for compliance with Claude Code plugin spec:
 * hooks, agents, skills, commands, settings, CLAUDE.md.
 *
 * Produces interactive HTML report and/or structured JSON.
 */

import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import type { CliArgs } from "./types.js";
import { log } from "./helpers.js";
import { auditAllPlugins, generateHtmlReport, generateJsonReport } from "../../lib/plugin/audit-report.js";

export async function runAuditPluginsMode(opts: CliArgs): Promise<void> {
  const pluginsDir = opts.outputDir
    ? resolve(opts.outputDir, "plugins")
    : resolve("examples/plugins");

  log(`Auditing plugins in: ${pluginsDir}`);

  const summary = auditAllPlugins(pluginsDir);

  if (summary.totalPlugins === 0) {
    log("No plugins found. Run --plugin first to build plugins.");
    return;
  }

  log(`\nAudit Results:`);
  log(`  Plugins: ${summary.totalPlugins} (${summary.passedPlugins} passed)`);
  log(`  Average score: ${summary.averageScore}%`);
  log(`  Skills: ${summary.totalSkills}`);
  log(`  Agents: ${summary.totalAgents}`);
  log(`  Hooks: ${summary.totalHooks}`);
  log(`  Commands: ${summary.totalCommands}`);
  log("");

  // Print per-plugin results
  for (const result of summary.results) {
    const icon = result.passed ? "PASS" : "FAIL";
    const failedChecks = result.checks.filter(c => !c.passed && c.severity === "error");
    const warnings = result.checks.filter(c => !c.passed && c.severity === "warning");
    log(`  [${icon}] ${result.domain} — ${result.score}% (${result.skillCount}s ${result.agentCount}a ${result.hookCount}h ${result.commandCount}c)${failedChecks.length > 0 ? ` | ${failedChecks.length} error(s)` : ""}${warnings.length > 0 ? ` | ${warnings.length} warning(s)` : ""}`);
  }

  // Output reports
  if (opts.json) {
    const jsonReport = generateJsonReport(summary);
    if (opts.out) {
      writeFileSync(opts.out, jsonReport, "utf-8");
      log(`\nJSON report written to: ${opts.out}`);
    } else {
      console.log(jsonReport);
    }
  } else {
    // Generate HTML report
    const htmlReport = generateHtmlReport(summary);
    const outDir = opts.outputDir || "examples";
    const htmlPath = resolve(outDir, "audit-report.html");
    mkdirSync(resolve(outDir), { recursive: true });
    writeFileSync(htmlPath, htmlReport, "utf-8");
    log(`\nHTML report written to: ${htmlPath}`);
  }
}
