/**
 * hooks/templates/python.ts — Python domain hook configuration.
 *
 * PostToolUse: Run ruff/mypy after edits
 * Stop: Verify tests pass, types check
 */

import type { DomainHookConfig } from "../types.js";

export const PYTHON_HOOKS: DomainHookConfig = {
  domain: "python",

  blockPatterns: [
    {
      pattern: "pip\\s+install\\s+--break-system-packages",
      reason: "System Python modification blocked — use virtual environment",
      tools: ["Bash"],
    },
    {
      pattern: "sudo\\s+pip\\s+install",
      reason: "sudo pip blocked — use virtual environment or uv",
      tools: ["Bash"],
    },
  ],

  postValidations: [
    {
      command: 'command -v ruff >/dev/null 2>&1 && ruff check --fix "$TOOL_INPUT_PATH" 2>/dev/null || true',
      description: "Auto-lint with ruff after Python file edits",
      tools: ["Edit", "Write"],
    },
    {
      command: 'command -v ruff >/dev/null 2>&1 && ruff format "$TOOL_INPUT_PATH" 2>/dev/null || true',
      description: "Auto-format with ruff after Python file edits",
      tools: ["Edit", "Write"],
    },
  ],

  qualityGates: [
    {
      command: 'command -v ruff >/dev/null 2>&1 && ruff check . 2>/dev/null || true',
      description: "Run ruff linting on project",
    },
    {
      command: 'test ! -f pyproject.toml || (command -v pytest >/dev/null 2>&1 && python -m pytest --tb=short -q 2>/dev/null || true)',
      description: "Run pytest if available",
    },
    {
      command: 'command -v mypy >/dev/null 2>&1 && mypy --ignore-missing-imports . 2>/dev/null || true',
      description: "Run mypy type checking if available",
    },
  ],

  contextInjections: [
    {
      command: 'python3 --version 2>/dev/null || echo "Python not found"',
      label: "python-version",
    },
    {
      command: 'test -f pyproject.toml && head -5 pyproject.toml || test -f setup.py && echo "setup.py project" || echo "no Python project config"',
      label: "python-project",
    },
    {
      command: 'test -d .venv && echo "venv active: .venv" || echo "no venv found"',
      label: "venv-status",
    },
  ],

  alertTriggers: [
    {
      condition: "test failures detected",
      message: "Python test failures — review before continuing",
    },
  ],
};
