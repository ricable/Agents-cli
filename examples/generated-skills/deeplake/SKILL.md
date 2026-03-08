---
name: deeplake
version: 0.0.0
description: "CLI tool: deeplake. Use this skill when working with deeplake-related tasks."
ingredients:
  - activeloopai/deeplake
tags:
  - cli
---

# deeplake

CLI tool: deeplake

## Usage

```bash
# Show help
deeplake --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run deeplake -- --help --json

# Introspect command schema
agents-cli schema deeplake --json

# Dry-run before executing
agents-cli run deeplake -- <args> --dry-run
```
