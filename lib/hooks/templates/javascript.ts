/**
 * hooks/templates/javascript.ts — JavaScript/TypeScript domain hook configuration.
 *
 * PostToolUse: Run eslint/prettier after edits
 * Stop: Verify types check, tests pass
 */

import type { DomainHookConfig } from "../types.js";

export const JAVASCRIPT_HOOKS: DomainHookConfig = {
  domain: "javascript",

  blockPatterns: [
    {
      pattern: "npm\\s+install\\s+--force\\s+--legacy-peer-deps",
      reason: "Double-forced npm install blocked — fix peer deps properly",
      tools: ["Bash"],
    },
    {
      pattern: "rm\\s+-rf\\s+node_modules\\s*&&\\s*rm\\s+.*lock",
      reason: "Nuclear node_modules cleanup blocked — try npm ci instead",
      tools: ["Bash"],
    },
  ],

  postValidations: [
    {
      command: 'test ! -f .eslintrc* && test ! -f eslint.config* || npx eslint --fix "$TOOL_INPUT_PATH" 2>/dev/null || true',
      description: "Auto-lint with eslint after JS/TS edits",
      tools: ["Edit", "Write"],
    },
    {
      command: 'test ! -f .prettierrc* || npx prettier --write "$TOOL_INPUT_PATH" 2>/dev/null || true',
      description: "Auto-format with prettier after edits",
      tools: ["Edit", "Write"],
    },
  ],

  qualityGates: [
    {
      command: 'test ! -f tsconfig.json || npx tsc --noEmit 2>/dev/null',
      description: "TypeScript type checking",
    },
    {
      command: 'test ! -f package.json || (grep -q "\"test\"" package.json && npm test 2>/dev/null || true)',
      description: "Run npm test if configured",
    },
  ],

  contextInjections: [
    {
      command: 'node --version 2>/dev/null || echo "Node.js not found"',
      label: "node-version",
    },
    {
      command: "test -f package.json && node -e 'const p=require(\"./package.json\");console.log(p.name+\" \"+p.version)' 2>/dev/null || echo 'no package.json'",
      label: "package-info",
    },
    {
      command: 'test -f tsconfig.json && echo "TypeScript project" || echo "JavaScript project"',
      label: "project-type",
    },
  ],

  alertTriggers: [
    {
      condition: "type errors detected",
      message: "TypeScript type errors — fix before continuing",
    },
  ],
};
