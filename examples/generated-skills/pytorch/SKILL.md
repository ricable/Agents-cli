---
name: pytorch
version: 0.0.0
description: "CLI tool: pytorch. Use this skill when working with pytorch-related tasks."
ingredients:
  - pytorch/pytorch
tags:
  - cli
---

# pytorch

CLI tool: pytorch

## Usage

```bash
# Show help
pytorch --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pytorch -- --help --json

# Introspect command schema
agents-cli schema pytorch --json

# Dry-run before executing
agents-cli run pytorch -- <args> --dry-run
```
