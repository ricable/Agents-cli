---
name: semantic-router
version: 0.0.0
description: "CLI tool: semantic-router. Use this skill when working with semantic-router-related tasks."
ingredients:
  - aurelio-labs/semantic-router
tags:
  - cli
---

# semantic-router

CLI tool: semantic-router

## Usage

```bash
# Show help
semantic-router --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run semantic-router -- --help --json

# Introspect command schema
agents-cli schema semantic-router --json

# Dry-run before executing
agents-cli run semantic-router -- <args> --dry-run
```
