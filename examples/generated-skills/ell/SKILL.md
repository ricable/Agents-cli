---
name: ell
version: 0.0.0
description: "CLI tool: ell. Use this skill when working with ell-related tasks."
ingredients:
  - MadcowD/ell
tags:
  - cli
---

# ell

CLI tool: ell

## Usage

```bash
# Show help
ell --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ell -- --help --json

# Introspect command schema
agents-cli schema ell --json

# Dry-run before executing
agents-cli run ell -- <args> --dry-run
```
