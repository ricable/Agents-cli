---
name: phoenix
version: 0.0.0
description: "CLI tool: phoenix. Use this skill when working with phoenix-related tasks."
ingredients:
  - Arize-ai/phoenix
tags:
  - cli
---

# phoenix

CLI tool: phoenix

## Usage

```bash
# Show help
phoenix --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run phoenix -- --help --json

# Introspect command schema
agents-cli schema phoenix --json

# Dry-run before executing
agents-cli run phoenix -- <args> --dry-run
```
