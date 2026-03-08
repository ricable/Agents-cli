---
name: sentence-transformers
version: 0.0.0
description: "CLI tool: sentence-transformers. Use this skill when working with sentence-transformers-related tasks."
ingredients:
  - UKPLab/sentence-transformers
tags:
  - cli
---

# sentence-transformers

CLI tool: sentence-transformers

## Usage

```bash
# Show help
sentence-transformers --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run sentence-transformers -- --help --json

# Introspect command schema
agents-cli schema sentence-transformers --json

# Dry-run before executing
agents-cli run sentence-transformers -- <args> --dry-run
```
