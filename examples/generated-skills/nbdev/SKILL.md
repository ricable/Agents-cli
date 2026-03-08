---
name: nbdev
version: 0.0.0
description: "CLI tool: nbdev. Use this skill when working with nbdev-related tasks."
ingredients:
  - fastai/nbdev
tags:
  - cli
---

# nbdev

CLI tool: nbdev

## Usage

```bash
# Show help
nbdev --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run nbdev -- --help --json

# Introspect command schema
agents-cli schema nbdev --json

# Dry-run before executing
agents-cli run nbdev -- <args> --dry-run
```
