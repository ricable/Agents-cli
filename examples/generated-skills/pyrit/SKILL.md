---
name: PyRIT
version: 0.0.0
description: "CLI tool: PyRIT. Use this skill when working with PyRIT-related tasks."
ingredients:
  - Azure/PyRIT
tags:
  - cli
---

# PyRIT

CLI tool: PyRIT

## Usage

```bash
# Show help
PyRIT --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run PyRIT -- --help --json

# Introspect command schema
agents-cli schema PyRIT --json

# Dry-run before executing
agents-cli run PyRIT -- <args> --dry-run
```
