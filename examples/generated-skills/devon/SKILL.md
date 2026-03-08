---
name: Devon
version: 0.0.0
description: "CLI tool: Devon. Use this skill when working with Devon-related tasks."
ingredients:
  - entropy-research/Devon
tags:
  - cli
---

# Devon

CLI tool: Devon

## Usage

```bash
# Show help
Devon --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run Devon -- --help --json

# Introspect command schema
agents-cli schema Devon --json

# Dry-run before executing
agents-cli run Devon -- <args> --dry-run
```
