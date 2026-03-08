---
name: AugLy
version: 0.0.0
description: "CLI tool: AugLy. Use this skill when working with AugLy-related tasks."
ingredients:
  - facebookresearch/AugLy
tags:
  - cli
---

# AugLy

CLI tool: AugLy

## Usage

```bash
# Show help
AugLy --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run AugLy -- --help --json

# Introspect command schema
agents-cli schema AugLy --json

# Dry-run before executing
agents-cli run AugLy -- <args> --dry-run
```
