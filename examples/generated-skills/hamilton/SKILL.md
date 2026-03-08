---
name: hamilton
version: 0.0.0
description: "CLI tool: hamilton. Use this skill when working with hamilton-related tasks."
ingredients:
  - DAGWorks-Inc/hamilton
tags:
  - cli
---

# hamilton

CLI tool: hamilton

## Usage

```bash
# Show help
hamilton --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run hamilton -- --help --json

# Introspect command schema
agents-cli schema hamilton --json

# Dry-run before executing
agents-cli run hamilton -- <args> --dry-run
```
