---
name: watchexec
version: 0.0.0
description: "CLI tool: watchexec. Use this skill when working with watchexec-related tasks."
ingredients:
  - watchexec/watchexec
tags:
  - cli
---

# watchexec

CLI tool: watchexec

## Usage

```bash
# Show help
watchexec --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run watchexec -- --help --json

# Introspect command schema
agents-cli schema watchexec --json

# Dry-run before executing
agents-cli run watchexec -- <args> --dry-run
```
