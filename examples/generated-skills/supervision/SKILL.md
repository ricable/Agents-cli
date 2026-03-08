---
name: supervision
version: 0.0.0
description: "CLI tool: supervision. Use this skill when working with supervision-related tasks."
ingredients:
  - roboflow/supervision
tags:
  - cli
---

# supervision

CLI tool: supervision

## Usage

```bash
# Show help
supervision --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run supervision -- --help --json

# Introspect command schema
agents-cli schema supervision --json

# Dry-run before executing
agents-cli run supervision -- <args> --dry-run
```
