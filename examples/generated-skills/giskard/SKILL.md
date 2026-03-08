---
name: giskard
version: 0.0.0
description: "CLI tool: giskard. Use this skill when working with giskard-related tasks."
ingredients:
  - Giskard-AI/giskard
tags:
  - cli
---

# giskard

CLI tool: giskard

## Usage

```bash
# Show help
giskard --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run giskard -- --help --json

# Introspect command schema
agents-cli schema giskard --json

# Dry-run before executing
agents-cli run giskard -- <args> --dry-run
```
