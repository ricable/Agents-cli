---
name: AdalFlow
version: 0.0.0
description: "CLI tool: AdalFlow. Use this skill when working with AdalFlow-related tasks."
ingredients:
  - SylphAI-Inc/AdalFlow
tags:
  - cli
---

# AdalFlow

CLI tool: AdalFlow

## Usage

```bash
# Show help
AdalFlow --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run AdalFlow -- --help --json

# Introspect command schema
agents-cli schema AdalFlow --json

# Dry-run before executing
agents-cli run AdalFlow -- <args> --dry-run
```
