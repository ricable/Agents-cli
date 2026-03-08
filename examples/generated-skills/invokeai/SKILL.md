---
name: InvokeAI
version: 0.0.0
description: "CLI tool: InvokeAI. Use this skill when working with InvokeAI-related tasks."
ingredients:
  - invoke-ai/InvokeAI
tags:
  - cli
---

# InvokeAI

CLI tool: InvokeAI

## Usage

```bash
# Show help
InvokeAI --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run InvokeAI -- --help --json

# Introspect command schema
agents-cli schema InvokeAI --json

# Dry-run before executing
agents-cli run InvokeAI -- <args> --dry-run
```
