---
name: ColBERT
version: 0.0.0
description: "CLI tool: ColBERT. Use this skill when working with ColBERT-related tasks."
ingredients:
  - stanford-futuredata/ColBERT
tags:
  - cli
---

# ColBERT

CLI tool: ColBERT

## Usage

```bash
# Show help
ColBERT --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ColBERT -- --help --json

# Introspect command schema
agents-cli schema ColBERT --json

# Dry-run before executing
agents-cli run ColBERT -- <args> --dry-run
```
