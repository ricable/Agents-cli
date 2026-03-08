---
name: cobra
version: 0.0.0
description: "CLI tool: cobra. Use this skill when working with cobra-related tasks."
ingredients:
  - spf13/cobra
tags:
  - cli
---

# cobra

CLI tool: cobra

## Usage

```bash
# Show help
cobra --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run cobra -- --help --json

# Introspect command schema
agents-cli schema cobra --json

# Dry-run before executing
agents-cli run cobra -- <args> --dry-run
```
