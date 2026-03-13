/**
 * hooks/templates/testing.ts — Testing domain hook configuration.
 *
 * Stop: Verify all tests pass, coverage meets threshold
 * PostToolUse: Run related tests after code changes
 */

import type { DomainHookConfig } from "../types.js";

export const TESTING_HOOKS: DomainHookConfig = {
  domain: "testing",

  blockPatterns: [
    {
      pattern: "\\.skip\\s*\\(",
      reason: "Test .skip() detected — ensure this is intentional, not leftover debugging",
      tools: ["Edit", "Write"],
    },
    {
      pattern: "\\.only\\s*\\(",
      reason: "Test .only() detected — will skip other tests if committed",
      tools: ["Edit", "Write"],
    },
  ],

  postValidations: [
    {
      command: 'echo "Test file modified at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${CLAUDE_PLUGIN_ROOT}/hooks/.test-audit.log"',
      description: "Log test file modifications",
      tools: ["Edit", "Write"],
    },
  ],

  qualityGates: [
    {
      command: 'test ! -f package.json || npm test 2>/dev/null',
      description: "Run full test suite",
    },
    {
      command: '! grep -rn "\\.only\\s*(" --include="*.test.*" --include="*.spec.*" . 2>/dev/null | grep -v node_modules | head -1 | grep -q .',
      description: "Verify no .only() left in test files",
    },
    {
      command: '! grep -rn "\\.skip\\s*(" --include="*.test.*" --include="*.spec.*" . 2>/dev/null | grep -v node_modules | head -1 | grep -q .',
      description: "Verify no .skip() left in test files",
    },
  ],

  contextInjections: [
    {
      command: 'find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | grep -v node_modules | wc -l | xargs printf "Test files: %s"',
      label: "test-file-count",
    },
    {
      command: "test ! -f package.json || node -e 'const p=require(\"./package.json\");console.log(\"Test runner: \"+(p.scripts?.test || \"not configured\"))' 2>/dev/null",
      label: "test-runner",
    },
  ],

  alertTriggers: [
    {
      condition: "test failures",
      message: "Test failures detected — fix before continuing",
    },
  ],
};
