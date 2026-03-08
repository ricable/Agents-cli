---
name: dvc
version: 0.0.0
description: "CLI tool: dvc. Use this skill when working with dvc-related tasks."
ingredients:
  - iterative/dvc
tags:
  - cli
---

# dvc

CLI tool: dvc

## Usage

```bash
# Show help
dvc --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run dvc -- --help --json

# Introspect command schema
agents-cli schema dvc --json

# Dry-run before executing
agents-cli run dvc -- <args> --dry-run
```
