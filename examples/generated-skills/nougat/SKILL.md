---
name: nougat
version: 0.0.0
description: "CLI tool: nougat. Use this skill when working with nougat-related tasks."
ingredients:
  - facebookresearch/nougat
tags:
  - cli
---

# nougat

CLI tool: nougat

## Usage

```bash
# Show help
nougat --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run nougat -- --help --json

# Introspect command schema
agents-cli schema nougat --json

# Dry-run before executing
agents-cli run nougat -- <args> --dry-run
```
