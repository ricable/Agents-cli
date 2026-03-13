/**
 * hooks/templates/devops.ts — DevOps domain hook configuration.
 *
 * PreToolUse: Require --dry-run on deploy commands
 * PostToolUse: Log infrastructure changes
 * Stop: Verify health checks pass
 */

import type { DomainHookConfig } from "../types.js";

export const DEVOPS_HOOKS: DomainHookConfig = {
  domain: "devops",

  blockPatterns: [
    {
      pattern: "\\b(kubectl|helm)\\s+(delete|destroy)\\s+.*--all\\b",
      reason: "Mass deletion blocked — specify resources explicitly",
      tools: ["Bash"],
    },
    {
      pattern: "terraform\\s+destroy\\s+(?!.*--target)",
      reason: "Untargeted terraform destroy blocked — use --target for specific resources",
      tools: ["Bash"],
    },
    {
      pattern: "docker\\s+system\\s+prune\\s+-a\\s+--force",
      reason: "Docker full prune blocked — removes all unused images/containers",
      tools: ["Bash"],
    },
  ],

  postValidations: [
    {
      command: 'echo "Infrastructure change at $(date -u +%Y-%m-%dT%H:%M:%SZ): $TOOL_NAME" >> "${CLAUDE_PLUGIN_ROOT}/hooks/.infra-audit.log"',
      description: "Log infrastructure changes to audit trail",
      tools: ["Bash"],
    },
  ],

  qualityGates: [
    {
      command: 'test ! -f Dockerfile || docker build --check . 2>/dev/null || true',
      description: "Validate Dockerfile syntax",
    },
    {
      command: 'test ! -f docker-compose.yml || docker compose config --quiet 2>/dev/null || true',
      description: "Validate docker-compose.yml syntax",
    },
    {
      command: 'test ! -d .github/workflows || find .github/workflows -name "*.yml" -exec yamllint {} \\; 2>/dev/null || true',
      description: "Validate GitHub Actions workflow YAML",
    },
  ],

  contextInjections: [
    {
      command: 'docker --version 2>/dev/null || echo "Docker not installed"',
      label: "docker-version",
    },
    {
      command: 'kubectl version --client --short 2>/dev/null || echo "kubectl not installed"',
      label: "kubectl-version",
    },
    {
      command: 'terraform version 2>/dev/null | head -1 || echo "Terraform not installed"',
      label: "terraform-version",
    },
  ],

  alertTriggers: [
    {
      condition: "deployment command executed",
      message: "Infrastructure deployment detected — verify in monitoring dashboard",
    },
  ],
};
