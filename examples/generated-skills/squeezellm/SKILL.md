---
name: SqueezeLLM
version: 0.0.0
description: "CLI tool: SqueezeLLM. Use this skill when working with SqueezeLLM-related tasks."
ingredients:
  - SqueezeAILab/SqueezeLLM
tags:
  - cli
---

# SqueezeLLM

CLI tool: SqueezeLLM

## Usage

```bash
# Show help
SqueezeLLM --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run SqueezeLLM -- --help --json

# Introspect command schema
agents-cli schema SqueezeLLM --json

# Dry-run before executing
agents-cli run SqueezeLLM -- <args> --dry-run
```
