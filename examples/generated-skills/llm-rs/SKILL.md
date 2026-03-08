---
name: llm
version: 0.0.0
description: "CLI tool: llm. Use this skill when working with llm-related tasks."
ingredients:
  - simonw/llm
tags:
  - cli
---

# llm

CLI tool: llm

## Usage

```bash
# Show help
llm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llm -- --help --json

# Introspect command schema
agents-cli schema llm --json

# Dry-run before executing
agents-cli run llm -- <args> --dry-run
```
