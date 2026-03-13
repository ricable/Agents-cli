/**
 * plugin/team-generator.ts — Generate agent team templates per domain.
 *
 * Produces SKILL.md files that orchestrate multiple domain agents
 * working together on complex tasks.
 */

import type { AgentMarkdownFile } from "./ai-generator.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface TeamConfig {
  /** Team name (e.g. "python-review-team") */
  name: string;
  /** Team description */
  description: string;
  /** Agent roles in the team */
  roles: TeamRole[];
  /** Workflow steps */
  workflow: string[];
}

export interface TeamRole {
  /** Role name (e.g. "linter") */
  name: string;
  /** Agent suffix (e.g. "python-linter") */
  agentName: string;
  /** What this role does */
  responsibility: string;
}

// ── Domain team registry ───────────────────────────────────────────────

export const DOMAIN_TEAMS: Record<string, TeamConfig> = {
  "python": {
    name: "python-review-team",
    description: "Python code review and quality team",
    roles: [
      { name: "linter", agentName: "python-linter", responsibility: "Run ruff/flake8 and fix linting issues" },
      { name: "tester", agentName: "python-tester", responsibility: "Run pytest and verify test coverage" },
      { name: "formatter", agentName: "python-formatter", responsibility: "Format code with black/ruff format" },
    ],
    workflow: [
      "1. Linter agent scans for style/quality issues",
      "2. Formatter agent applies consistent formatting",
      "3. Tester agent runs test suite and reports coverage",
      "4. Expert synthesizes results and reports",
    ],
  },
  "database": {
    name: "database-migration-team",
    description: "Database migration and query optimization team",
    roles: [
      { name: "migrator", agentName: "database-migrator", responsibility: "Create and validate migration files" },
      { name: "validator", agentName: "database-query-validator", responsibility: "Validate queries for correctness and performance" },
    ],
    workflow: [
      "1. Migrator creates migration files from schema changes",
      "2. Validator checks migration SQL for destructive operations",
      "3. Expert reviews and applies migrations",
    ],
  },
  "security": {
    name: "security-audit-team",
    description: "Security scanning and vulnerability assessment team",
    roles: [
      { name: "scanner", agentName: "security-scanner", responsibility: "Run security scanners (trivy, semgrep)" },
      { name: "auditor", agentName: "security-auditor", responsibility: "Audit dependencies and configurations" },
    ],
    workflow: [
      "1. Scanner runs automated security tools",
      "2. Auditor reviews dependencies and secrets",
      "3. Expert prioritizes and reports findings",
    ],
  },
  "javascript": {
    name: "javascript-quality-team",
    description: "JavaScript/TypeScript code quality team",
    roles: [
      { name: "linter", agentName: "javascript-linter", responsibility: "Run eslint and fix issues" },
      { name: "type-checker", agentName: "javascript-type-checker", responsibility: "Run tsc and fix type errors" },
      { name: "tester", agentName: "javascript-tester", responsibility: "Run tests and verify coverage" },
    ],
    workflow: [
      "1. Type checker validates TypeScript types",
      "2. Linter scans for code quality issues",
      "3. Tester runs test suite",
      "4. Expert reports results",
    ],
  },
  "devops": {
    name: "devops-deploy-team",
    description: "Deployment and infrastructure validation team",
    roles: [
      { name: "validator", agentName: "devops-validator", responsibility: "Validate Dockerfiles, configs, and manifests" },
      { name: "deployer", agentName: "devops-deployer", responsibility: "Execute deployment pipeline" },
    ],
    workflow: [
      "1. Validator checks all configuration files",
      "2. Deployer executes deployment with --dry-run first",
      "3. Expert verifies health checks after deploy",
    ],
  },
  "git": {
    name: "git-review-team",
    description: "Code review and PR management team",
    roles: [
      { name: "reviewer", agentName: "git-reviewer", responsibility: "Review code changes for quality" },
      { name: "merger", agentName: "git-merger", responsibility: "Handle merge conflicts and rebasing" },
    ],
    workflow: [
      "1. Reviewer analyzes diff and comments",
      "2. If conflicts exist, merger resolves them",
      "3. Expert approves and merges",
    ],
  },
  "testing": {
    name: "testing-coverage-team",
    description: "Test coverage and quality team",
    roles: [
      { name: "generator", agentName: "test-generator", responsibility: "Generate missing test cases" },
      { name: "runner", agentName: "test-runner", responsibility: "Run tests and collect coverage" },
    ],
    workflow: [
      "1. Runner executes existing test suite",
      "2. Generator identifies coverage gaps",
      "3. Generator creates new test cases",
      "4. Runner re-executes and verifies coverage",
    ],
  },
  "cloud": {
    name: "cloud-infrastructure-team",
    description: "Cloud infrastructure provisioning and validation team",
    roles: [
      { name: "planner", agentName: "cloud-planner", responsibility: "Plan infrastructure changes with terraform plan" },
      { name: "validator", agentName: "cloud-validator", responsibility: "Validate security groups, IAM, and policies" },
    ],
    workflow: [
      "1. Planner creates terraform plan",
      "2. Validator checks for security issues",
      "3. Expert reviews and applies",
    ],
  },
};

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Generate a team SKILL.md that orchestrates domain agents.
 */
export function generateTeamSkill(domain: string, _agents: string[]): string | null {
  const baseDomain = domain.split("/")[0]!;
  const team = DOMAIN_TEAMS[baseDomain];
  if (!team) return null;

  const flatDomain = domain.replace(/\//g, "-");
  const kebabName = `${flatDomain}-team`;

  const s: string[] = [];
  s.push("---");
  s.push(`name: ${kebabName}`);
  s.push(`description: "${team.description}. Use when you need multiple ${baseDomain} agents working together on a complex task."`);
  s.push("context: fork");
  s.push(`allowed-tools: "Read,Grep,Glob,Bash,Agent"`);
  s.push(`tags:`);
  s.push(`  - ${baseDomain}`);
  s.push(`  - team`);
  s.push(`  - workflow`);
  s.push("---");
  s.push("");
  s.push(`# ${team.name}`);
  s.push("");
  s.push(team.description);
  s.push("");
  s.push("## Team Roles");
  s.push("");
  for (const role of team.roles) {
    s.push(`- **${role.name}** (\`${role.agentName}\`): ${role.responsibility}`);
  }
  s.push("");
  s.push("## Workflow");
  s.push("");
  for (const step of team.workflow) {
    s.push(step);
  }
  s.push("");
  s.push("## Instructions");
  s.push("");
  s.push(`When "$ARGUMENTS" is provided:`);
  s.push("1. Parse the task and determine which team members are needed");
  s.push("2. Spawn the appropriate agents using the Agent tool");
  s.push("3. Collect and synthesize results from each agent");
  s.push("4. Produce a final report with findings and actions taken");
  s.push("");

  return s.join("\n");
}

/**
 * Generate worker agent markdown files for a domain.
 */
export function generateWorkerAgents(domain: string): AgentMarkdownFile[] {
  const baseDomain = domain.split("/")[0]!;
  const team = DOMAIN_TEAMS[baseDomain];
  if (!team) return [];

  return team.roles.map(role => ({
    name: role.agentName,
    content: [
      "---",
      `name: ${role.agentName}`,
      `description: "${role.responsibility}. Use when the ${baseDomain} team needs a ${role.name} specialist."`,
      `model: haiku`,
      `maxTurns: 3`,
      "---",
      "",
      `You are a specialized ${role.name} agent for ${baseDomain} workflows.`,
      "",
      `## Your Role`,
      "",
      role.responsibility,
      "",
      `## Constraints`,
      "",
      `- Focus only on ${role.name} tasks — delegate other work back to the expert`,
      `- Complete your work within 3 turns`,
      `- Report results in structured format`,
      `- Do not fabricate commands — verify before running`,
      "",
    ].join("\n"),
  }));
}
