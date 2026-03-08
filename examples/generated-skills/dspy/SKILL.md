---
name: dspy
version: 0.0.0
description: "CLI tool: dspy. Use this skill when working with dspy-related tasks."
ingredients:
  - stanfordnlp/dspy
tags:
  - cli
---

# dspy

CLI tool: dspy

## Usage

```bash
# Show help
dspy --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run dspy -- --help --json

# Introspect command schema
agents-cli schema dspy --json

# Dry-run before executing
agents-cli run dspy -- <args> --dry-run
```
