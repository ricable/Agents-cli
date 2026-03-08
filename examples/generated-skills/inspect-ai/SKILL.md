---
name: inspect_ai
version: 0.0.0
description: "CLI tool: inspect_ai. Use this skill when working with inspect_ai-related tasks."
ingredients:
  - UKGovernmentBEIS/inspect_ai
tags:
  - cli
---

# inspect_ai

CLI tool: inspect_ai

## Usage

```bash
# Show help
inspect_ai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run inspect_ai -- --help --json

# Introspect command schema
agents-cli schema inspect_ai --json

# Dry-run before executing
agents-cli run inspect_ai -- <args> --dry-run
```
