---
name: counterfit
version: 0.0.0
description: "CLI tool: counterfit. Use this skill when working with counterfit-related tasks."
ingredients:
  - Azure/counterfit
tags:
  - cli
---

# counterfit

CLI tool: counterfit

## Usage

```bash
# Show help
counterfit --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run counterfit -- --help --json

# Introspect command schema
agents-cli schema counterfit --json

# Dry-run before executing
agents-cli run counterfit -- <args> --dry-run
```
