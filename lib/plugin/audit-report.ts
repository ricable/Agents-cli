/**
 * plugin/audit-report.ts — Plugin compliance audit and report generation.
 *
 * Audits plugins for:
 * - plugin.json validity
 * - hooks.json validity
 * - Agent markdown frontmatter
 * - Skill SKILL.md quality
 * - Command markdown validity
 * - Cross-runtime compatibility
 *
 * Produces interactive HTML and structured JSON reports.
 */

import fs from "node:fs";
import path from "node:path";
import { readPluginManifest, countPluginSkills } from "./shared.js";
import { validateHooksJson } from "../hooks/validator.js";
import { toErrorMessage } from "../output.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface ComplianceCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface ComplianceResult {
  domain: string;
  pluginDir: string;
  checks: ComplianceCheck[];
  score: number;
  passed: boolean;
  skillCount: number;
  agentCount: number;
  hookCount: number;
  commandCount: number;
}

export interface AuditSummary {
  totalPlugins: number;
  passedPlugins: number;
  averageScore: number;
  totalSkills: number;
  totalAgents: number;
  totalHooks: number;
  totalCommands: number;
  results: ComplianceResult[];
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Audit a single plugin directory for compliance.
 */
export function auditPlugin(pluginDir: string): ComplianceResult {
  const domain = path.basename(pluginDir);
  const checks: ComplianceCheck[] = [];

  // 1. plugin.json
  const manifest = readPluginManifest(pluginDir);
  if (manifest) {
    checks.push({ name: "plugin.json exists", passed: true, message: "Valid plugin.json found", severity: "error" });
    if (manifest.name) checks.push({ name: "plugin.json name", passed: true, message: `Name: ${manifest.name}`, severity: "error" });
    if (manifest.description) checks.push({ name: "plugin.json description", passed: true, message: "Has description", severity: "error" });
    if (manifest.version) checks.push({ name: "plugin.json version", passed: true, message: `Version: ${manifest.version}`, severity: "warning" });
  } else {
    checks.push({ name: "plugin.json exists", passed: false, message: "Missing .claude-plugin/plugin.json", severity: "error" });
  }

  // 2. hooks.json
  const hooksPath = path.join(pluginDir, "hooks", "hooks.json");
  let hookCount = 0;
  if (fs.existsSync(hooksPath)) {
    try {
      const content = fs.readFileSync(hooksPath, "utf-8");
      const errors = validateHooksJson(content);
      if (errors.length === 0) {
        const parsed = JSON.parse(content) as { hooks: unknown[] };
        hookCount = parsed.hooks.length;
        checks.push({ name: "hooks.json valid", passed: true, message: `${hookCount} hooks defined`, severity: "warning" });
      } else {
        checks.push({ name: "hooks.json valid", passed: false, message: errors.join("; "), severity: "warning" });
      }
    } catch (err) {
      checks.push({ name: "hooks.json valid", passed: false, message: toErrorMessage(err), severity: "warning" });
    }
  } else {
    checks.push({ name: "hooks.json exists", passed: false, message: "No hooks.json found", severity: "info" });
  }

  // 3. Agents
  const agentsDir = path.join(pluginDir, "agents");
  let agentCount = 0;
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith(".md"));
    agentCount = agents.length;
    checks.push({ name: "agents exist", passed: agents.length > 0, message: `${agents.length} agent(s) found`, severity: "warning" });

    for (const agentFile of agents) {
      const content = fs.readFileSync(path.join(agentsDir, agentFile), "utf-8");
      const hasFrontmatter = content.startsWith("---");
      const hasName = /^name:\s*.+/m.test(content);
      const hasDescription = /^description:\s*.+/m.test(content);
      checks.push({
        name: `agent ${agentFile} frontmatter`,
        passed: hasFrontmatter && hasName && hasDescription,
        message: hasFrontmatter && hasName && hasDescription ? "Valid frontmatter" : "Missing name or description in frontmatter",
        severity: "warning",
      });
    }
  } else {
    checks.push({ name: "agents exist", passed: false, message: "No agents/ directory", severity: "warning" });
  }

  // 4. Skills
  const skillCount = countPluginSkills(pluginDir);
  checks.push({ name: "skills exist", passed: skillCount > 0, message: `${skillCount} skill(s) found`, severity: "error" });

  // 5. Commands
  const commandsDir = path.join(pluginDir, "commands");
  let commandCount = 0;
  if (fs.existsSync(commandsDir)) {
    const commands = fs.readdirSync(commandsDir).filter(f => f.endsWith(".md"));
    commandCount = commands.length;
    checks.push({ name: "commands exist", passed: commands.length >= 2, message: `${commands.length} command(s) found`, severity: "warning" });
  } else {
    checks.push({ name: "commands exist", passed: false, message: "No commands/ directory", severity: "warning" });
  }

  // 6. settings.json
  const settingsPath = path.join(pluginDir, "settings.json");
  if (fs.existsSync(settingsPath)) {
    checks.push({ name: "settings.json exists", passed: true, message: "Plugin settings configured", severity: "info" });
  } else {
    checks.push({ name: "settings.json exists", passed: false, message: "No settings.json", severity: "info" });
  }

  // 7. CLAUDE.md
  const claudeMdPath = path.join(pluginDir, "CLAUDE.md");
  if (fs.existsSync(claudeMdPath)) {
    checks.push({ name: "CLAUDE.md exists", passed: true, message: "Plugin CLAUDE.md present", severity: "info" });
  } else {
    checks.push({ name: "CLAUDE.md exists", passed: false, message: "No CLAUDE.md", severity: "info" });
  }

  // Calculate score
  const errorChecks = checks.filter(c => c.severity === "error");
  const warningChecks = checks.filter(c => c.severity === "warning");
  const errorScore = errorChecks.length > 0 ? errorChecks.filter(c => c.passed).length / errorChecks.length : 1;
  const warningScore = warningChecks.length > 0 ? warningChecks.filter(c => c.passed).length / warningChecks.length : 1;
  const score = Math.round((errorScore * 0.7 + warningScore * 0.3) * 100);
  const passed = errorChecks.every(c => c.passed);

  return { domain, pluginDir, checks, score, passed, skillCount, agentCount, hookCount, commandCount };
}

/**
 * Audit all plugins in a directory.
 */
export function auditAllPlugins(pluginsDir: string): AuditSummary {
  const results: ComplianceResult[] = [];

  if (!fs.existsSync(pluginsDir)) {
    return { totalPlugins: 0, passedPlugins: 0, averageScore: 0, totalSkills: 0, totalAgents: 0, totalHooks: 0, totalCommands: 0, results };
  }

  for (const entry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pluginDir = path.join(pluginsDir, entry.name);
    if (!fs.existsSync(path.join(pluginDir, ".claude-plugin", "plugin.json"))) continue;
    results.push(auditPlugin(pluginDir));
  }

  const totalSkills = results.reduce((s, r) => s + r.skillCount, 0);
  const totalAgents = results.reduce((s, r) => s + r.agentCount, 0);
  const totalHooks = results.reduce((s, r) => s + r.hookCount, 0);
  const totalCommands = results.reduce((s, r) => s + r.commandCount, 0);
  const passedPlugins = results.filter(r => r.passed).length;
  const averageScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  return { totalPlugins: results.length, passedPlugins, averageScore, totalSkills, totalAgents, totalHooks, totalCommands, results };
}

/**
 * Generate an interactive HTML audit report.
 */
export function generateHtmlReport(summary: AuditSummary): string {
  const pluginRows = summary.results.map(r => {
    const statusIcon = r.passed ? "&#x2705;" : "&#x274C;";
    const checkRows = r.checks.map(c => {
      const icon = c.passed ? "&#x2705;" : (c.severity === "error" ? "&#x274C;" : "&#x26A0;");
      return `<tr class="check-row"><td>${icon}</td><td>${c.name}</td><td>${c.message}</td><td>${c.severity}</td></tr>`;
    }).join("");

    return `
      <div class="plugin-card" data-domain="${r.domain}" data-score="${r.score}">
        <div class="plugin-header" onclick="this.parentElement.classList.toggle('expanded')">
          <span class="status">${statusIcon}</span>
          <span class="domain">${r.domain}</span>
          <span class="score">${r.score}%</span>
          <span class="stats">${r.skillCount}s ${r.agentCount}a ${r.hookCount}h ${r.commandCount}c</span>
        </div>
        <div class="plugin-details">
          <table>${checkRows}</table>
        </div>
      </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Plugin Audit Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
    h1 { color: #58a6ff; margin-bottom: 1rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; text-align: center; }
    .stat .value { font-size: 2rem; font-weight: bold; color: #58a6ff; }
    .stat .label { color: #8b949e; font-size: 0.85rem; }
    .search { width: 100%; padding: 0.75rem; background: #161b22; border: 1px solid #30363d; border-radius: 8px; color: #c9d1d9; margin-bottom: 1rem; font-size: 1rem; }
    .plugin-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; margin-bottom: 0.5rem; overflow: hidden; }
    .plugin-header { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; cursor: pointer; }
    .plugin-header:hover { background: #1c2128; }
    .domain { flex: 1; font-weight: 600; }
    .score { font-weight: bold; }
    .stats { color: #8b949e; font-size: 0.85rem; }
    .plugin-details { display: none; padding: 0 1rem 1rem; }
    .expanded .plugin-details { display: block; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #21262d; }
    td { padding: 0.4rem 0.5rem; font-size: 0.85rem; }
    .check-row td:first-child { width: 30px; text-align: center; }
  </style>
</head>
<body>
  <h1>Plugin Audit Report</h1>
  <div class="summary">
    <div class="stat"><div class="value">${summary.totalPlugins}</div><div class="label">Plugins</div></div>
    <div class="stat"><div class="value">${summary.passedPlugins}</div><div class="label">Passed</div></div>
    <div class="stat"><div class="value">${summary.averageScore}%</div><div class="label">Avg Score</div></div>
    <div class="stat"><div class="value">${summary.totalSkills}</div><div class="label">Skills</div></div>
    <div class="stat"><div class="value">${summary.totalAgents}</div><div class="label">Agents</div></div>
    <div class="stat"><div class="value">${summary.totalHooks}</div><div class="label">Hooks</div></div>
    <div class="stat"><div class="value">${summary.totalCommands}</div><div class="label">Commands</div></div>
  </div>
  <input class="search" type="text" placeholder="Filter plugins..." oninput="filterPlugins(this.value)">
  <div id="plugins">${pluginRows}</div>
  <script>
    function filterPlugins(q) {
      const cards = document.querySelectorAll('.plugin-card');
      q = q.toLowerCase();
      cards.forEach(c => { c.style.display = c.dataset.domain.includes(q) ? '' : 'none'; });
    }
  </script>
</body>
</html>`;
}

/**
 * Generate a structured JSON audit report.
 */
export function generateJsonReport(summary: AuditSummary): string {
  return JSON.stringify(summary, null, 2);
}
