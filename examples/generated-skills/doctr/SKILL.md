---
name: doctr
version: 0.0.0
description: "CLI tool: doctr. Use this skill when working with doctr-related tasks."
ingredients:
  - mindee/doctr
tags:
  - cli
---

# doctr

CLI tool: doctr

## Usage

```bash
# Show help
doctr --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run doctr -- --help --json

# Introspect command schema
agents-cli schema doctr --json

# Dry-run before executing
agents-cli run doctr -- <args> --dry-run
```
