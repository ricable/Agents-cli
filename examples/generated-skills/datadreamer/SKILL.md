---
name: DataDreamer
version: 0.0.0
description: "CLI tool: DataDreamer. Use this skill when working with DataDreamer-related tasks."
ingredients:
  - datadreamer-dev/DataDreamer
tags:
  - cli
---

# DataDreamer

CLI tool: DataDreamer

## Usage

```bash
# Show help
DataDreamer --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run DataDreamer -- --help --json

# Introspect command schema
agents-cli schema DataDreamer --json

# Dry-run before executing
agents-cli run DataDreamer -- <args> --dry-run
```
