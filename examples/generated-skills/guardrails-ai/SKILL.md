---
name: guardrails
version: 0.0.0
description: "CLI tool: guardrails. Use this skill when working with guardrails-related tasks."
ingredients:
  - guardrails-ai/guardrails
tags:
  - cli
---

# guardrails

CLI tool: guardrails

## Usage

```bash
# Show help
guardrails --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run guardrails -- --help --json

# Introspect command schema
agents-cli schema guardrails --json

# Dry-run before executing
agents-cli run guardrails -- <args> --dry-run
```
