/**
 * hooks/templates/security.ts — Security domain hook configuration.
 *
 * PreToolUse: Block unsafe network requests, credential exposure
 * PostToolUse: Log security-relevant commands
 * Stop: Verify no secrets committed
 */

import type { DomainHookConfig } from "../types.js";

export const SECURITY_HOOKS: DomainHookConfig = {
  domain: "security",

  blockPatterns: [
    {
      pattern: "curl\\s+.*\\b(10\\.\\d+|172\\.(1[6-9]|2\\d|3[01])|192\\.168)\\.",
      reason: "Request to private IP range blocked — potential SSRF",
      tools: ["Bash"],
    },
    {
      pattern: "curl\\s+.*\\b(169\\.254\\.169\\.254|metadata\\.google)",
      reason: "Request to cloud metadata endpoint blocked — credential theft risk",
      tools: ["Bash"],
    },
    {
      pattern: "(password|secret|token|api.?key)\\s*=\\s*['\"][^'\"]{8,}",
      reason: "Hardcoded credential detected — use environment variables",
      tools: ["Edit", "Write"],
    },
    {
      pattern: "chmod\\s+777\\b",
      reason: "chmod 777 blocked — use minimal permissions (755 for dirs, 644 for files)",
      tools: ["Bash"],
    },
    {
      pattern: "\\beval\\s*\\(",
      reason: "eval() usage blocked — potential code injection",
      tools: ["Edit", "Write"],
    },
  ],

  postValidations: [
    {
      command: 'echo "Security-relevant command at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${CLAUDE_PLUGIN_ROOT}/hooks/.security-audit.log"',
      description: "Log security-relevant tool usage",
      tools: ["Bash"],
    },
  ],

  qualityGates: [
    {
      command: '! git diff --cached --name-only 2>/dev/null | grep -qE "\\.(env|pem|key|p12|pfx)$"',
      description: "Verify no secrets in staged files",
    },
    {
      command: "! grep -rn 'password\\s*=\\s*.' --include='*.ts' --include='*.js' --include='*.py' . 2>/dev/null | grep -v node_modules | grep -v '.git' | head -1 | grep -q .",
      description: "Check for hardcoded passwords in source files",
    },
  ],

  contextInjections: [
    {
      command: 'git log --oneline -5 2>/dev/null || echo "not a git repo"',
      label: "recent-commits",
    },
    {
      command: 'test -f .env && echo ".env file present ($(wc -l < .env) lines)" || echo "no .env file"',
      label: "env-status",
    },
  ],

  alertTriggers: [
    {
      condition: "secret or credential detected",
      message: "Potential secret detected in code — review before committing",
    },
  ],
};
