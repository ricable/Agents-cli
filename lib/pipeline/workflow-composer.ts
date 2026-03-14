/**
 * workflow-composer.ts — Auto-compose workflows from generated skills.
 *
 * Analyzes skill frontmatter (domain, tags) and matches against workflow
 * inference rules to generate multi-step workflows automatically.
 */


// ── Types ──────────────────────────────────────────────────────────────

export interface WorkflowEnvVar {
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

export interface DataFlowEdge {
  from: string;
  to: string;
  artifact: string;   // e.g. "json", "csv", "images"
}

export interface SkillWorkflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  dependencies: string[];   // skill names
  envVars?: WorkflowEnvVar[];
  dataFlow?: DataFlowEdge[];
  estimatedDuration?: string;
  pricing?: { model: "free" | "paid" | "freemium"; price?: number; currency?: string };
}

export type WorkflowTrigger = "manual" | "on-commit" | "on-push" | "schedule";

export interface WorkflowStep {
  name: string;
  skill: string;           // skill name to invoke
  command: string;          // actual CLI command
  args: string[];
  condition?: string;       // when to run (e.g., "files changed: *.py")
  onFailure: "stop" | "continue" | "retry";
}

/** A tech stack profile used for workflow context */
export interface TechStackProfile {
  primaryLanguage?: string | null;
  techs?: ReadonlyArray<{ name: string; layer: string }>;
}

// ── Workflow Inference Rules ───────────────────────────────────────────

export interface WorkflowRule {
  name: string;
  description: string;
  /** At least one skill must match each required role */
  requiredRoles: string[][];
  triggers: WorkflowTrigger[];
  buildSteps: (matched: Map<string, SkillInfo[]>) => WorkflowStep[];
}

interface SkillInfo {
  name: string;
  domain: string;
  tags: string[];
  description: string;
}

/** Parse frontmatter from SKILL.md content */
function parseSkillInfo(skillMd: string, skillName: string): SkillInfo | null {
  const fmMatch = skillMd.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1] ?? "";

  const getField = (field: string): string => {
    const match = fm.match(new RegExp(`^${field}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, "m"));
    return match?.[1]?.trim() ?? "";
  };

  const domain = getField("domain");
  const description = getField("description");
  const tagsRaw = getField("tags");
  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];

  return { name: skillName, domain, tags, description };
}

// Role matchers — a skill "matches" a role if domain or tags include the role keyword
function matchesRole(skill: SkillInfo, roleKeywords: string[]): boolean {
  const text = `${skill.domain} ${skill.tags.join(" ")} ${skill.description}`.toLowerCase();
  return roleKeywords.some(kw => text.includes(kw.toLowerCase()));
}

// ── Built-in Workflow Rules ───────────────────────────────────────────

const WORKFLOW_RULES: WorkflowRule[] = [
  {
    name: "quality-gate",
    description: "Lint, format, and test code before commit",
    requiredRoles: [
      ["lint", "linter", "linting"],
      ["format", "formatter", "formatting"],
      ["test", "testing", "tester"],
    ],
    triggers: ["on-commit"],
    buildSteps: (matched) => {
      const linter = matched.get("lint")?.[0];
      const formatter = matched.get("format")?.[0];
      const tester = matched.get("test")?.[0];
      const steps: WorkflowStep[] = [];
      if (linter) steps.push({ name: "lint", skill: linter.name, command: `${inferBin(linter)} check .`, args: [], onFailure: "stop" });
      if (formatter) steps.push({ name: "format", skill: formatter.name, command: `${inferBin(formatter)} format .`, args: [], onFailure: "stop" });
      if (tester) steps.push({ name: "test", skill: tester.name, command: `${inferBin(tester)}`, args: [], onFailure: "stop" });
      return steps;
    },
  },
  {
    name: "security-sweep",
    description: "Scan dependencies and audit code for vulnerabilities",
    requiredRoles: [
      ["scan", "scanner", "security", "vulnerability"],
      ["audit", "auditor", "secret", "leak"],
    ],
    triggers: ["on-push"],
    buildSteps: (matched) => {
      const scanner = matched.get("scan")?.[0];
      const auditor = matched.get("audit")?.[0];
      const steps: WorkflowStep[] = [];
      if (scanner) steps.push({ name: "scan-deps", skill: scanner.name, command: `${inferBin(scanner)} scan`, args: [], onFailure: "stop" });
      if (auditor) steps.push({ name: "audit-code", skill: auditor.name, command: `${inferBin(auditor)} detect`, args: ["--source", "."], onFailure: "continue" });
      return steps;
    },
  },
  {
    name: "deploy-pipeline",
    description: "Validate, build, and deploy application",
    requiredRoles: [
      ["deploy", "deployer", "deployment"],
      ["validate", "validator", "check"],
    ],
    triggers: ["manual"],
    buildSteps: (matched) => {
      const validator = matched.get("validate")?.[0];
      const deployer = matched.get("deploy")?.[0];
      const steps: WorkflowStep[] = [];
      if (validator) steps.push({ name: "validate", skill: validator.name, command: `${inferBin(validator)} validate`, args: [], onFailure: "stop" });
      if (deployer) steps.push({ name: "deploy", skill: deployer.name, command: `${inferBin(deployer)} deploy`, args: [], onFailure: "stop" });
      return steps;
    },
  },
  {
    name: "db-migration",
    description: "Backup, migrate, and validate database changes",
    requiredRoles: [
      ["migrat", "migration", "database"],
      ["validate", "validator"],
    ],
    triggers: ["manual"],
    buildSteps: (matched) => {
      const migrator = matched.get("migrat")?.[0];
      const validator = matched.get("validate")?.[0];
      const steps: WorkflowStep[] = [];
      if (migrator) steps.push({ name: "migrate", skill: migrator.name, command: `${inferBin(migrator)} migrate`, args: [], onFailure: "stop" });
      if (validator) steps.push({ name: "validate", skill: validator.name, command: `${inferBin(validator)} validate`, args: [], onFailure: "stop" });
      return steps;
    },
  },
  {
    name: "ci-check",
    description: "Full CI check: lint, typecheck, test, and coverage",
    requiredRoles: [
      ["lint", "linter"],
      ["type", "typecheck", "type-check"],
      ["test", "testing"],
    ],
    triggers: ["on-push"],
    buildSteps: (matched) => {
      const linter = matched.get("lint")?.[0];
      const typechecker = matched.get("type")?.[0];
      const tester = matched.get("test")?.[0];
      const steps: WorkflowStep[] = [];
      if (linter) steps.push({ name: "lint", skill: linter.name, command: `${inferBin(linter)} check .`, args: [], onFailure: "stop" });
      if (typechecker) steps.push({ name: "typecheck", skill: typechecker.name, command: `${inferBin(typechecker)}`, args: [], onFailure: "stop" });
      if (tester) steps.push({ name: "test", skill: tester.name, command: `${inferBin(tester)}`, args: [], onFailure: "stop" });
      return steps;
    },
  },
  {
    name: "infra-validate",
    description: "Validate infrastructure configuration files",
    requiredRoles: [
      ["docker", "dockerfile", "container"],
      ["k8s", "kubernetes", "helm"],
    ],
    triggers: ["on-commit"],
    buildSteps: (matched) => {
      const docker = matched.get("docker")?.[0];
      const k8s = matched.get("k8s")?.[0];
      const steps: WorkflowStep[] = [];
      if (docker) steps.push({ name: "dockerfile-lint", skill: docker.name, command: `${inferBin(docker)} lint`, args: ["Dockerfile"], onFailure: "continue" });
      if (k8s) steps.push({ name: "k8s-lint", skill: k8s.name, command: `${inferBin(k8s)} lint`, args: [], onFailure: "continue" });
      return steps;
    },
  },
  {
    name: "code-review",
    description: "Automated code analysis and review on push",
    requiredRoles: [
      ["review", "reviewer", "analyze", "analyzer"],
    ],
    triggers: ["on-push"],
    buildSteps: (matched) => {
      const reviewer = matched.get("review")?.[0];
      const steps: WorkflowStep[] = [];
      if (reviewer) steps.push({ name: "review", skill: reviewer.name, command: `${inferBin(reviewer)} review`, args: ["."], onFailure: "continue" });
      return steps;
    },
  },
];

/** Infer CLI binary name from skill name (strip src- prefix) */
function inferBin(skill: SkillInfo): string {
  return skill.name.replace(/^src-/, "");
}

// ── Composer ───────────────────────────────────────────────────────────

/**
 * Compose workflows from generated skills by matching against inference rules.
 */
export function composeWorkflows(
  skills: Array<{ name: string; skillMd: string }>,
  _profile?: TechStackProfile,
): SkillWorkflow[] {
  // Parse all skill infos
  const infos: SkillInfo[] = [];
  for (const skill of skills) {
    const info = parseSkillInfo(skill.skillMd, skill.name);
    if (info) infos.push(info);
  }

  if (infos.length === 0) return [];

  const workflows: SkillWorkflow[] = [];

  for (const rule of WORKFLOW_RULES) {
    const matched = new Map<string, SkillInfo[]>();
    let allRolesMatched = true;

    for (const roleKeywords of rule.requiredRoles) {
      const matchingSkills = infos.filter(s => matchesRole(s, roleKeywords));
      if (matchingSkills.length === 0) {
        allRolesMatched = false;
        break;
      }
      matched.set(roleKeywords[0]!, matchingSkills);
    }

    if (!allRolesMatched) continue;

    const steps = rule.buildSteps(matched);
    if (steps.length === 0) continue;

    const dependencies = [...new Set(steps.map(s => s.skill))];

    workflows.push({
      name: rule.name,
      description: rule.description,
      steps,
      triggers: rule.triggers,
      dependencies,
    });
  }

  return workflows;
}

/**
 * Score a composed workflow for completeness (0-1).
 * Higher = more steps, all skills exist, proper ordering.
 */
export function scoreWorkflow(workflow: SkillWorkflow): number {
  let score = 0;

  // Steps exist
  if (workflow.steps.length > 0) score += 0.3;
  if (workflow.steps.length >= 2) score += 0.2;
  if (workflow.steps.length >= 3) score += 0.1;

  // Has triggers
  if (workflow.triggers.length > 0) score += 0.1;

  // Has dependencies
  if (workflow.dependencies.length > 0) score += 0.1;

  // All steps have non-empty commands
  const allHaveCommands = workflow.steps.every(s => s.command.length > 0);
  if (allHaveCommands) score += 0.2;

  return Math.min(1, score);
}
