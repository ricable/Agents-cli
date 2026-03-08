---
name: pydantic-ai
version: 0.0.0
description: "CLI tool: pydantic-ai. Use this skill when working with pydantic-ai-related tasks."
ingredients:
  - pydantic/pydantic-ai
tags:
  - cli
---

# pydantic-ai

CLI tool: pydantic-ai

## Usage

```bash
# Show help
pydantic-ai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pydantic-ai -- --help --json

# Introspect command schema
agents-cli schema pydantic-ai --json

# Dry-run before executing
agents-cli run pydantic-ai -- <args> --dry-run
```
