---
name: claude-dev
version: 3.71.0
description: "CLI tool: claude-dev. Use this skill when working with claude-dev-related tasks."
ingredients:
  - saoudrizwan/claude-dev
tags:
  - cli
---

# claude-dev

CLI tool: claude-dev

## Usage

```bash
# Show help
claude-dev --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run claude-dev -- --help --json

# Introspect command schema
agents-cli schema claude-dev --json

# Dry-run before executing
agents-cli run claude-dev -- <args> --dry-run
```
