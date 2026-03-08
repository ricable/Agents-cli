---
name: agno
version: 0.0.0
description: "CLI tool: agno. Use this skill when working with agno-related tasks."
ingredients:
  - agno-agi/agno
tags:
  - cli
---

# agno

CLI tool: agno

## Usage

```bash
# Show help
agno --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run agno -- --help --json

# Introspect command schema
agents-cli schema agno --json

# Dry-run before executing
agents-cli run agno -- <args> --dry-run
```
