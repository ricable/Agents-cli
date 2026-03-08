---
name: distilabel
version: 0.0.0
description: "CLI tool: distilabel. Use this skill when working with distilabel-related tasks."
ingredients:
  - argilla-io/distilabel
tags:
  - cli
---

# distilabel

CLI tool: distilabel

## Usage

```bash
# Show help
distilabel --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run distilabel -- --help --json

# Introspect command schema
agents-cli schema distilabel --json

# Dry-run before executing
agents-cli run distilabel -- <args> --dry-run
```
