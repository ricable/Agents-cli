/**
 * hooks/templates/git.ts — Git domain hook configuration.
 *
 * PreToolUse: Block force-push, destructive resets
 * PostToolUse: Log commit activity
 */

import type { DomainHookConfig } from "../types.js";

export const GIT_HOOKS: DomainHookConfig = {
  domain: "git",

  blockPatterns: [
    {
      pattern: "git\\s+push\\s+.*--force(?!-with-lease)",
      reason: "Force push blocked — use --force-with-lease for safety",
      tools: ["Bash"],
    },
    {
      pattern: "git\\s+reset\\s+--hard\\s+(?!HEAD\\b)",
      reason: "Hard reset to non-HEAD blocked — may lose uncommitted work",
      tools: ["Bash"],
    },
    {
      pattern: "git\\s+clean\\s+-[a-zA-Z]*f[a-zA-Z]*d",
      reason: "git clean -fd blocked — permanently removes untracked files",
      tools: ["Bash"],
    },
    {
      pattern: "git\\s+branch\\s+-D\\s+(?:main|master)\\b",
      reason: "Deleting main/master branch blocked",
      tools: ["Bash"],
    },
  ],

  postValidations: [
    {
      command: 'echo "Git operation at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${CLAUDE_PLUGIN_ROOT}/hooks/.git-audit.log"',
      description: "Log git operations to audit trail",
      tools: ["Bash"],
    },
  ],

  qualityGates: [
    {
      command: 'test -z "$(git diff --check 2>/dev/null)" || echo "Whitespace issues in staged changes"',
      description: "Check for whitespace issues",
    },
    {
      command: '! git diff --cached --name-only 2>/dev/null | grep -qE "\\.(env|pem|key)$"',
      description: "Verify no secrets in staged files",
    },
  ],

  contextInjections: [
    {
      command: 'git branch --show-current 2>/dev/null || echo "detached HEAD"',
      label: "current-branch",
    },
    {
      command: 'git log --oneline -5 2>/dev/null || echo "no git history"',
      label: "recent-commits",
    },
    {
      command: 'git status --porcelain 2>/dev/null | wc -l | xargs printf "Changed files: %s"',
      label: "changes-count",
    },
  ],

  alertTriggers: [
    {
      condition: "push to main/master",
      message: "Push to main branch detected — ensure CI passes",
    },
  ],
};
