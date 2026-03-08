---
name: argilla
version: 0.0.0
description: "CLI tool: argilla. Use this skill when working with argilla-related tasks."
ingredients:
  - argilla-io/argilla
tags:
  - cli
---

# argilla

CLI tool: argilla

## Usage

```bash
# Show help
argilla --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run argilla -- --help --json

# Introspect command schema
agents-cli schema argilla --json

# Dry-run before executing
agents-cli run argilla -- <args> --dry-run
```
