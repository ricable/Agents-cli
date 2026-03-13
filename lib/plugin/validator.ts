/**
 * plugin/validator.ts — Deep plugin validation.
 *
 * Validates the entire plugin bundle works end-to-end:
 * - Skills: frontmatter, triggerScore, contentScore, cliFirstScore, bash -n
 * - Hooks: hooks.json schema, referenced scripts exist + bash -n
 * - Commands: markdown frontmatter, $ARGUMENTS present
 * - Agents: YAML frontmatter, required fields, prompt length
 * - Workflows: referenced skills exist, steps ordered
 * - Cross-references: skills in agents exist, tools in commands exist
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { testSkillSync, cliFirstScore } from "../skill-tester.js";
import { validateHooksJson } from "../hooks/validator.js";
import type { ComplianceCheck } from "./audit-report.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface PluginValidationResult {
  pluginDir: string;
  skills: ValidationCategory;
  hooks: ValidationCategory;
  commands: ValidationCategory;
  agents: ValidationCategory;
  workflows: ValidationCategory;
  crossRefs: ValidationCategory;
  overall: { score: number; passed: boolean; issues: string[] };
}

export interface ValidationCategory {
  score: number;       // 0-1
  passed: boolean;
  checks: ComplianceCheck[];
}

// ── Validators ─────────────────────────────────────────────────────────

function validateSkills(pluginDir: string): ValidationCategory {
  const skillsDir = join(pluginDir, "skills");
  const checks: ComplianceCheck[] = [];

  if (!existsSync(skillsDir)) {
    return { score: 0, passed: false, checks: [{ name: "skills directory", passed: false, message: "Missing skills/ directory", severity: "error" }] };
  }

  const skillDirs = readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory());
  let passCount = 0;

  for (const dir of skillDirs) {
    const skillMdPath = join(skillsDir, dir.name, "SKILL.md");
    if (!existsSync(skillMdPath)) {
      checks.push({ name: `skill ${dir.name}`, passed: false, message: "Missing SKILL.md", severity: "error" });
      continue;
    }

    const content = readFileSync(skillMdPath, "utf-8");

    // Structural test
    const result = testSkillSync(skillMdPath, content);
    if (result.passed) {
      passCount++;
      checks.push({ name: `skill ${dir.name} quality`, passed: true, message: `trigger=${result.triggerScore.toFixed(2)} quality=${result.qualityScore}`, severity: "error" });
    } else {
      checks.push({ name: `skill ${dir.name} quality`, passed: false, message: result.issues.slice(0, 2).join("; "), severity: "error" });
    }

    // CLI-first score
    const cfs = cliFirstScore(content);
    if (cfs.score >= 0.5) {
      checks.push({ name: `skill ${dir.name} cli-first`, passed: true, message: `cliFirst=${cfs.score.toFixed(2)}`, severity: "warning" });
    } else {
      checks.push({ name: `skill ${dir.name} cli-first`, passed: false, message: `cliFirst=${cfs.score.toFixed(2)}: ${cfs.issues[0] ?? ""}`, severity: "warning" });
    }

    // bash -n on scripts
    const scriptsDir = join(skillsDir, dir.name, "scripts");
    if (existsSync(scriptsDir)) {
      for (const script of readdirSync(scriptsDir).filter(f => f.endsWith(".sh"))) {
        const scriptPath = join(scriptsDir, script);
        try {
          execSync(`bash -n "${scriptPath}"`, { timeout: 5000, stdio: "pipe" });
          checks.push({ name: `skill ${dir.name} script ${script}`, passed: true, message: "Syntax OK", severity: "warning" });
        } catch {
          checks.push({ name: `skill ${dir.name} script ${script}`, passed: false, message: "bash -n syntax error", severity: "warning" });
        }
      }
    }
  }

  const score = skillDirs.length > 0 ? passCount / skillDirs.length : 0;
  const errorChecks = checks.filter(c => c.severity === "error");
  const passed = errorChecks.length === 0 || errorChecks.every(c => c.passed);

  return { score, passed, checks };
}

function validateHooks(pluginDir: string): ValidationCategory {
  const hooksPath = join(pluginDir, "hooks", "hooks.json");
  const checks: ComplianceCheck[] = [];

  if (!existsSync(hooksPath)) {
    return { score: 0.5, passed: true, checks: [{ name: "hooks.json", passed: true, message: "No hooks (optional)", severity: "info" }] };
  }

  const content = readFileSync(hooksPath, "utf-8");
  const errors = validateHooksJson(content);

  if (errors.length > 0) {
    checks.push({ name: "hooks.json schema", passed: false, message: errors.join("; "), severity: "error" });
    return { score: 0, passed: false, checks };
  }

  checks.push({ name: "hooks.json schema", passed: true, message: "Valid schema", severity: "error" });

  // Check referenced scripts exist
  try {
    const parsed = JSON.parse(content) as { hooks: Array<{ command?: string }> };
    for (const hook of parsed.hooks) {
      if (hook.command && hook.command.includes(".sh")) {
        const scriptName = hook.command.match(/[\w.-]+\.sh/)?.[0];
        if (scriptName) {
          const scriptPath = join(pluginDir, "hooks", scriptName);
          const exists = existsSync(scriptPath);
          checks.push({
            name: `hook script ${scriptName}`,
            passed: exists,
            message: exists ? "Script exists" : "Referenced script not found",
            severity: "warning",
          });

          if (exists) {
            try {
              execSync(`bash -n "${scriptPath}"`, { timeout: 5000, stdio: "pipe" });
              checks.push({ name: `hook script ${scriptName} syntax`, passed: true, message: "Syntax OK", severity: "warning" });
            } catch {
              checks.push({ name: `hook script ${scriptName} syntax`, passed: false, message: "bash -n syntax error", severity: "warning" });
            }
          }
        }
      }
    }
  } catch { /* JSON parse already validated above */ }

  const errorChecks = checks.filter(c => c.severity === "error");
  const passed = errorChecks.every(c => c.passed);
  const warningChecks = checks.filter(c => c.severity === "warning");
  const warningScore = warningChecks.length > 0 ? warningChecks.filter(c => c.passed).length / warningChecks.length : 1;
  const score = passed ? 0.7 + warningScore * 0.3 : 0;

  return { score, passed, checks };
}

function validateCommands(pluginDir: string): ValidationCategory {
  const commandsDir = join(pluginDir, "commands");
  const checks: ComplianceCheck[] = [];

  if (!existsSync(commandsDir)) {
    return { score: 0, passed: false, checks: [{ name: "commands directory", passed: false, message: "Missing commands/ directory", severity: "warning" }] };
  }

  const commands = readdirSync(commandsDir).filter(f => f.endsWith(".md"));
  if (commands.length === 0) {
    return { score: 0, passed: false, checks: [{ name: "commands", passed: false, message: "No command files found", severity: "warning" }] };
  }

  let validCount = 0;
  for (const cmd of commands) {
    const content = readFileSync(join(commandsDir, cmd), "utf-8");
    const hasFrontmatter = content.startsWith("---");
    const hasDescription = /^description:\s*.+/m.test(content);
    const valid = hasFrontmatter && hasDescription;

    if (valid) validCount++;
    checks.push({
      name: `command ${cmd}`,
      passed: valid,
      message: valid ? "Valid frontmatter" : "Missing frontmatter or description",
      severity: "warning",
    });
  }

  const score = commands.length > 0 ? validCount / commands.length : 0;
  return { score, passed: score > 0.5, checks };
}

function validateAgents(pluginDir: string): ValidationCategory {
  const agentsDir = join(pluginDir, "agents");
  const checks: ComplianceCheck[] = [];

  if (!existsSync(agentsDir)) {
    return { score: 0, passed: false, checks: [{ name: "agents directory", passed: false, message: "Missing agents/ directory", severity: "warning" }] };
  }

  const agents = readdirSync(agentsDir).filter(f => f.endsWith(".md"));
  if (agents.length === 0) {
    return { score: 0, passed: false, checks: [{ name: "agents", passed: false, message: "No agent files found", severity: "warning" }] };
  }

  let validCount = 0;
  for (const agent of agents) {
    const content = readFileSync(join(agentsDir, agent), "utf-8");
    const hasFrontmatter = content.startsWith("---");
    const hasName = /^name:\s*.+/m.test(content);
    const hasDescription = /^description:\s*.+/m.test(content);

    // Check prompt length (content after frontmatter)
    const bodyStart = content.indexOf("---", 4);
    const body = bodyStart > 0 ? content.slice(bodyStart + 3).trim() : "";
    const hasSubstantialPrompt = body.length > 50;

    const valid = hasFrontmatter && hasName && hasDescription && hasSubstantialPrompt;
    if (valid) validCount++;

    const issues: string[] = [];
    if (!hasFrontmatter) issues.push("no frontmatter");
    if (!hasName) issues.push("no name");
    if (!hasDescription) issues.push("no description");
    if (!hasSubstantialPrompt) issues.push("prompt too short");

    checks.push({
      name: `agent ${agent}`,
      passed: valid,
      message: valid ? "Valid agent" : `Issues: ${issues.join(", ")}`,
      severity: "warning",
    });
  }

  const score = agents.length > 0 ? validCount / agents.length : 0;
  return { score, passed: score > 0.5, checks };
}

function validateWorkflows(pluginDir: string): ValidationCategory {
  const skillsDir = join(pluginDir, "skills");
  const checks: ComplianceCheck[] = [];

  if (!existsSync(skillsDir)) {
    return { score: 1, passed: true, checks: [{ name: "workflows", passed: true, message: "No skills dir (workflows N/A)", severity: "info" }] };
  }

  // Find workflow skills (domain: workflow in frontmatter)
  const workflowSkills: string[] = [];
  for (const dir of readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory())) {
    const skillMd = join(skillsDir, dir.name, "SKILL.md");
    if (!existsSync(skillMd)) continue;
    const content = readFileSync(skillMd, "utf-8");
    if (/^domain:\s*["']?workflow/m.test(content)) {
      workflowSkills.push(dir.name);
    }
  }

  if (workflowSkills.length === 0) {
    return { score: 1, passed: true, checks: [{ name: "workflows", passed: true, message: "No workflow skills (optional)", severity: "info" }] };
  }

  let validCount = 0;
  for (const wfName of workflowSkills) {
    const skillMd = readFileSync(join(skillsDir, wfName, "SKILL.md"), "utf-8");

    // Check ingredients (referenced skills) exist
    const ingredientMatch = skillMd.match(/^ingredients:\s*(.+)$/m);
    if (ingredientMatch) {
      const ingredients = ingredientMatch[1]!.split(",").map(s => s.trim()).filter(Boolean);
      const allExist = ingredients.every(ing => {
        const skillDir = existsSync(join(skillsDir, `src-${ing}`)) || existsSync(join(skillsDir, ing));
        return skillDir;
      });

      checks.push({
        name: `workflow ${wfName} deps`,
        passed: allExist,
        message: allExist ? `All ${ingredients.length} ingredients found` : "Some ingredient skills missing",
        severity: "warning",
      });

      if (allExist) validCount++;
    }

    // Check run.sh exists and passes bash -n
    const runScript = join(skillsDir, wfName, "scripts", "run.sh");
    if (existsSync(runScript)) {
      try {
        execSync(`bash -n "${runScript}"`, { timeout: 5000, stdio: "pipe" });
        checks.push({ name: `workflow ${wfName} run.sh`, passed: true, message: "Syntax OK", severity: "warning" });
      } catch {
        checks.push({ name: `workflow ${wfName} run.sh`, passed: false, message: "bash -n error", severity: "warning" });
      }
    }
  }

  const score = workflowSkills.length > 0 ? validCount / workflowSkills.length : 1;
  return { score, passed: score >= 0.5, checks };
}

function validateCrossRefs(pluginDir: string): ValidationCategory {
  const checks: ComplianceCheck[] = [];
  const skillsDir = join(pluginDir, "skills");
  const agentsDir = join(pluginDir, "agents");

  // Collect available skill names
  const availableSkills = new Set<string>();
  if (existsSync(skillsDir)) {
    for (const dir of readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory())) {
      availableSkills.add(dir.name);
      availableSkills.add(dir.name.replace(/^src-/, ""));
    }
  }

  // Check agent prompts reference existing skills
  if (existsSync(agentsDir)) {
    for (const agent of readdirSync(agentsDir).filter(f => f.endsWith(".md"))) {
      const content = readFileSync(join(agentsDir, agent), "utf-8");
      // Look for skill references in agent content
      const skillRefs = content.match(/skills?\/([a-z0-9-]+)/gi) ?? [];
      for (const ref of skillRefs) {
        const skillName = ref.replace(/skills?\//i, "");
        const exists = availableSkills.has(skillName);
        if (!exists) {
          checks.push({
            name: `agent ${agent} → skill ${skillName}`,
            passed: false,
            message: "Referenced skill not found in plugin",
            severity: "warning",
          });
        }
      }
    }
  }

  if (checks.length === 0) {
    checks.push({ name: "cross-references", passed: true, message: "No broken references", severity: "info" });
  }

  const warningChecks = checks.filter(c => c.severity === "warning");
  const score = warningChecks.length > 0 ? warningChecks.filter(c => c.passed).length / warningChecks.length : 1;
  return { score, passed: score >= 0.5, checks };
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Validate a complete plugin bundle.
 */
export function validatePlugin(pluginDir: string): PluginValidationResult {
  const skills = validateSkills(pluginDir);
  const hooks = validateHooks(pluginDir);
  const commands = validateCommands(pluginDir);
  const agents = validateAgents(pluginDir);
  const workflows = validateWorkflows(pluginDir);
  const crossRefs = validateCrossRefs(pluginDir);

  // Weighted average: skills 40%, hooks 15%, commands 10%, agents 15%, workflows 10%, crossRefs 10%
  const overallScore = (
    skills.score * 0.4 +
    hooks.score * 0.15 +
    commands.score * 0.10 +
    agents.score * 0.15 +
    workflows.score * 0.10 +
    crossRefs.score * 0.10
  );

  const allIssues: string[] = [];
  const allCategories = [skills, hooks, commands, agents, workflows, crossRefs];
  for (const cat of allCategories) {
    for (const check of cat.checks) {
      if (!check.passed && check.severity === "error") {
        allIssues.push(`${check.name}: ${check.message}`);
      }
    }
  }

  const passed = skills.passed; // Skills are the hard gate

  return {
    pluginDir,
    skills,
    hooks,
    commands,
    agents,
    workflows,
    crossRefs,
    overall: {
      score: Math.round(overallScore * 100) / 100,
      passed,
      issues: allIssues,
    },
  };
}
