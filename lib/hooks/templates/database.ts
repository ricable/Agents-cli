/**
 * hooks/templates/database.ts — Database domain hook configuration.
 *
 * PreToolUse: Block destructive SQL (DROP, TRUNCATE, DELETE without WHERE)
 * PostToolUse: Log SQL commands executed
 * Stop: Verify migrations are up to date
 */

import type { DomainHookConfig } from "../types.js";

export const DATABASE_HOOKS: DomainHookConfig = {
  domain: "database",

  blockPatterns: [
    {
      pattern: "\\bDROP\\s+(TABLE|DATABASE|SCHEMA|INDEX)\\b",
      reason: "Destructive DROP statement blocked — use migrations instead",
      tools: ["Bash"],
    },
    {
      pattern: "\\bTRUNCATE\\s+TABLE\\b",
      reason: "TRUNCATE blocked — use DELETE with WHERE clause or migrations",
      tools: ["Bash"],
    },
    {
      pattern: "\\bDELETE\\s+FROM\\s+\\w+\\s*;",
      reason: "DELETE without WHERE clause blocked — specify conditions",
      tools: ["Bash"],
    },
    {
      pattern: "\\bALTER\\s+TABLE\\s+\\w+\\s+DROP\\b",
      reason: "ALTER TABLE DROP blocked — use reversible migrations",
      tools: ["Bash"],
    },
  ],

  postValidations: [
    {
      command: 'echo "SQL command executed at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${CLAUDE_PLUGIN_ROOT}/hooks/.sql-audit.log"',
      description: "Log SQL commands to audit trail",
      tools: ["Bash"],
    },
  ],

  qualityGates: [
    {
      command: 'test ! -d migrations || ls migrations/*.sql 2>/dev/null | tail -1 | xargs -I{} test -f {}',
      description: "Verify migration files exist and are readable",
    },
    {
      command: 'test ! -f .env || grep -q "DATABASE_URL" .env',
      description: "Check DATABASE_URL is configured",
    },
  ],

  contextInjections: [
    {
      command: 'ls migrations/*.sql 2>/dev/null | wc -l | xargs printf "Migration count: %s"',
      label: "migration-count",
    },
    {
      command: 'cat .env 2>/dev/null | grep "^DATABASE" | sed "s/=.*/=***/" || echo "No database config found"',
      label: "database-config",
    },
  ],

  alertTriggers: [
    {
      condition: "migration applied",
      message: "Database migration was applied — verify data integrity",
    },
  ],
};
