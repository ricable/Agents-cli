/**
 * hooks/templates/default.ts — Default hook configuration for all domains.
 *
 * Provides baseline hooks that apply universally:
 * - SessionStart: inject tool versions and project context
 * - Stop: basic quality check (no broken files)
 * - Notification: alert on long-running tasks
 */

import type { DomainHookConfig } from "../types.js";

export const DEFAULT_HOOKS: DomainHookConfig = {
  domain: "default",

  contextInjections: [
    {
      command: 'echo "Working directory: $(pwd)"',
      label: "working-directory",
    },
    {
      command: 'git rev-parse --short HEAD 2>/dev/null || echo "not a git repo"',
      label: "git-head",
    },
  ],

  qualityGates: [
    {
      command: 'test -z "$(find . -maxdepth 2 -name "*.ts" -newer .git/index 2>/dev/null | head -1)" || echo "unstaged TypeScript changes"',
      description: "Check for unstaged changes",
    },
  ],

  alertTriggers: [
    {
      condition: "task duration > 60s",
      message: "Long-running task detected",
    },
  ],
};
