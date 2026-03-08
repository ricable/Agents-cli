---
name: ibis
version: 0.0.0
description: "CLI tool: ibis. Use this skill when working with ibis-related tasks."
ingredients:
  - ibis-project/ibis
tags:
  - cli
---

# ibis

CLI tool: ibis

## Usage

```bash
# Show help
ibis --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ibis -- --help --json

# Introspect command schema
agents-cli schema ibis --json

# Dry-run before executing
agents-cli run ibis -- <args> --dry-run
```
