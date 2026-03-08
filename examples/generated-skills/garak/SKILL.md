---
name: garak
version: 0.0.0
description: "CLI tool: garak. Use this skill when working with garak-related tasks."
ingredients:
  - NVIDIA/garak
tags:
  - cli
---

# garak

CLI tool: garak

## Usage

```bash
# Show help
garak --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run garak -- --help --json

# Introspect command schema
agents-cli schema garak --json

# Dry-run before executing
agents-cli run garak -- <args> --dry-run
```
