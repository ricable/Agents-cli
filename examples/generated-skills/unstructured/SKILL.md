---
name: unstructured
version: 0.0.0
description: "CLI tool: unstructured. Use this skill when working with unstructured-related tasks."
ingredients:
  - Unstructured-IO/unstructured
tags:
  - cli
---

# unstructured

CLI tool: unstructured

## Usage

```bash
# Show help
unstructured --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run unstructured -- --help --json

# Introspect command schema
agents-cli schema unstructured --json

# Dry-run before executing
agents-cli run unstructured -- <args> --dry-run
```
