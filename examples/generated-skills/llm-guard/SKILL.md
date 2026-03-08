---
name: llm-guard
version: 0.0.0
description: "CLI tool: llm-guard. Use this skill when working with llm-guard-related tasks."
ingredients:
  - protectai/llm-guard
tags:
  - cli
---

# llm-guard

CLI tool: llm-guard

## Usage

```bash
# Show help
llm-guard --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llm-guard -- --help --json

# Introspect command schema
agents-cli schema llm-guard --json

# Dry-run before executing
agents-cli run llm-guard -- <args> --dry-run
```
