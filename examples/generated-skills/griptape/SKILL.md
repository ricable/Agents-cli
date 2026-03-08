---
name: griptape
version: 0.0.0
description: "CLI tool: griptape. Use this skill when working with griptape-related tasks."
ingredients:
  - griptape-ai/griptape
tags:
  - cli
---

# griptape

CLI tool: griptape

## Usage

```bash
# Show help
griptape --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run griptape -- --help --json

# Introspect command schema
agents-cli schema griptape --json

# Dry-run before executing
agents-cli run griptape -- <args> --dry-run
```
