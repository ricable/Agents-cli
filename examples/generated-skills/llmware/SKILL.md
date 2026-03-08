---
name: llmware
version: 0.0.0
description: "CLI tool: llmware. Use this skill when working with llmware-related tasks."
ingredients:
  - llmware-ai/llmware
tags:
  - cli
---

# llmware

CLI tool: llmware

## Usage

```bash
# Show help
llmware --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llmware -- --help --json

# Introspect command schema
agents-cli schema llmware --json

# Dry-run before executing
agents-cli run llmware -- <args> --dry-run
```
