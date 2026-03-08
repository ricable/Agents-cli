---
name: @anthropic-ai/claude-code
version: 2.1.71
description: "Use Claude, Anthropic's AI assistant, right from your terminal. Claude can understand your codebase, edit files, run terminal commands, and handle entire workflows for you.. Use this skill when the user needs @anthropic-ai/claude-code (commands: auth, doctor, mcp, plugin, setup-token), even if they don't mention "@anthropic-ai/claude-code" explicitly."
ingredients:
  - @anthropic-ai/claude-code
tags:
  - cli
# homepage: https://github.com/anthropics/claude-code
# license: SEE LICENSE IN README.md
---

# @anthropic-ai/claude-code

Use Claude, Anthropic's AI assistant, right from your terminal. Claude can understand your codebase, edit files, run terminal commands, and handle entire workflows for you.

**Source**: https://github.com/anthropics/claude-code

## Commands

### `@anthropic-ai/claude-code auth`

Manage authentication

**Flags:**
- `--help` (-h) — Display help for command

### `@anthropic-ai/claude-code doctor`

Check the health of your Claude Code auto-updater

**Flags:**
- `--help` (-h) — Display help for command

### `@anthropic-ai/claude-code mcp`

Configure and manage MCP servers

**Flags:**
- `--help` (-h) — Display help for command

### `@anthropic-ai/claude-code plugin`

Manage Claude Code plugins

**Flags:**
- `--help` (-h) — Display help for command

### `@anthropic-ai/claude-code setup-token`

Set up a long-lived authentication token (requires Claude subscription)

**Flags:**
- `--help` (-h) — Display help for command

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--add-dir` | — |  |
| `--agent` | — | Agent for the current session. Overrides the 'agent' setting. |
| `--agents` | — | JSON object defining custom agents (e.g. '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}') |
| `--allow-dangerously-skip-permissions` | — | Enable bypassing all permission checks as an option, without it being enabled by default. Recommended only for sandboxes with no internet access. |
| `--allowedTools` | — |  |
| `--append-system-prompt` | — | Append a system prompt to the default system prompt |
| `--betas` | — |  |
| `--chrome` | — | Enable Claude in Chrome integration |
| `--continue` | `-c` | Continue the most recent conversation in the current directory |
| `--dangerously-skip-permissions` | — | Bypass all permission checks. Recommended only for sandboxes with no internet access. |
| `--debug` | `-d` | Enable debug mode with optional category filtering (e.g., "api,hooks" or "!1p,!file") |
| `--debug-file` | — | Write debug logs to a specific file path (implicitly enables debug mode) |
| `--disable-slash-commands` | — | Disable all skills |
| `--disallowedTools` | — |  |
| `--effort` | — | Effort level for the current session (low, medium, high) |
| `--fallback-model` | — | Enable automatic fallback to specified model when default model is overloaded (only works with --print) |
| `--file` | — |  |
| `--fork-session` | — | When resuming, create a new session ID instead of reusing the original (use with --resume or --continue) |
| `--from-pr` | — | Resume a session linked to a PR by PR number/URL, or open interactive picker with optional search term |
| `--help` | `-h` | Display help for command |
| `--ide` | — | Automatically connect to IDE on startup if exactly one valid IDE is available |
| `--include-partial-messages` | — | Include partial message chunks as they arrive (only works with --print and --output-format=stream-json) |
| `--input-format` | — | Input format (only works with --print): "text" (default), or "stream-json" (realtime streaming input) (choices: "text", "stream-json") |
| `--json-schema` | — | JSON Schema for structured output validation. Example: {"type":"object","properties":{"name":{"type":"string"}},"required":["name"]} |
| `--max-budget-usd` | — | Maximum dollar amount to spend on API calls (only works with --print) |
| `--mcp-config` | — |  |
| `--mcp-debug` | — | [DEPRECATED. Use --debug instead] Enable MCP debug mode (shows MCP server errors) |
| `--model` | — | Model for the current session. Provide an alias for the latest model (e.g. 'sonnet' or 'opus') or a model's full name (e.g. 'claude-sonnet-4-6'). |
| `--no-chrome` | — | Disable Claude in Chrome integration |
| `--no-session-persistence` | — | Disable session persistence - sessions will not be saved to disk and cannot be resumed (only works with --print) |
| `--output-format` | — | Output format (only works with --print): "text" (default), "json" (single result), or "stream-json" (realtime streaming) (choices: "text", "json", "stream-json") |
| `--permission-mode` | — | Permission mode to use for the session (choices: "acceptEdits", "bypassPermissions", "default", "dontAsk", "plan", "auto") |
| `--plugin-dir` | — |  |
| `--print` | `-p` | Print response and exit (useful for pipes). Note: The workspace trust dialog is skipped when Claude is run with the -p mode. Only use this flag in directories you trust. |
| `--replay-user-messages` | — | Re-emit user messages from stdin back on stdout for acknowledgment (only works with --input-format=stream-json and --output-format=stream-json) |
| `--resume` | `-r` | Resume a conversation by session ID, or open interactive picker with optional search term |
| `--session-id` | — | Use a specific session ID for the conversation (must be a valid UUID) |
| `--setting-sources` | — | Comma-separated list of setting sources to load (user, project, local). |
| `--settings` | — |  |
| `--strict-mcp-config` | — | Only use MCP servers from --mcp-config, ignoring all other MCP configurations |
| `--system-prompt` | — | System prompt to use for the session |
| `--tmux` | — | Create a tmux session for the worktree (requires --worktree). Uses iTerm2 native panes when available; use --tmux=classic for traditional tmux. |
| `--tools` | — |  |
| `--verbose` | — | Override verbose mode setting from config |
| `--version` | `-v` | Output the version number |
| `--worktree` | `-w` | Create a new git worktree for this session (optionally specify a name) |

## Usage

```bash
# Show help
@anthropic-ai/claude-code --help

# Manage authentication
@anthropic-ai/claude-code auth

# Check the health of your Claude Code auto-updater
@anthropic-ai/claude-code doctor

# Configure and manage MCP servers
@anthropic-ai/claude-code mcp

# Manage Claude Code plugins
@anthropic-ai/claude-code plugin

# Set up a long-lived authentication token (requires Claude subscription)
@anthropic-ai/claude-code setup-token

```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @anthropic-ai/claude-code -- --help --json

# Introspect command schema
agents-cli schema @anthropic-ai/claude-code --json

# Dry-run before executing
agents-cli run @anthropic-ai/claude-code -- <args> --dry-run
```
