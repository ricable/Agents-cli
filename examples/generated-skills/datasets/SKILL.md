---
name: datasets
version: 0.0.0
description: "CLI tool: datasets. Use this skill when working with datasets-related tasks."
ingredients:
  - huggingface/datasets
tags:
  - cli
---

# datasets

CLI tool: datasets

## Usage

```bash
# Show help
datasets --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run datasets -- --help --json

# Introspect command schema
agents-cli schema datasets --json

# Dry-run before executing
agents-cli run datasets -- <args> --dry-run
```
