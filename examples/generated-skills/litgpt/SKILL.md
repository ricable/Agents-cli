---
name: litgpt
version: 0.0.0
description: "CLI tool: litgpt. Use this skill when working with litgpt-related tasks."
ingredients:
  - Lightning-AI/litgpt
tags:
  - cli
---

# litgpt

CLI tool: litgpt

## Usage

```bash
# Show help
litgpt --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run litgpt -- --help --json

# Introspect command schema
agents-cli schema litgpt --json

# Dry-run before executing
agents-cli run litgpt -- <args> --dry-run
```
