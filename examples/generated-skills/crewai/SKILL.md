---
name: crewAI
version: 0.0.0
description: "CLI tool: crewAI. Use this skill when working with crewAI-related tasks."
ingredients:
  - crewAIInc/crewAI
tags:
  - cli
---

# crewAI

CLI tool: crewAI

## Usage

```bash
# Show help
crewAI --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run crewAI -- --help --json

# Introspect command schema
agents-cli schema crewAI --json

# Dry-run before executing
agents-cli run crewAI -- <args> --dry-run
```
