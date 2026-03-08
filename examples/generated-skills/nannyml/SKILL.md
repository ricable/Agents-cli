---
name: nannyml
version: 0.0.0
description: "CLI tool: nannyml. Use this skill when working with nannyml-related tasks."
ingredients:
  - NannyML/nannyml
tags:
  - cli
---

# nannyml

CLI tool: nannyml

## Usage

```bash
# Show help
nannyml --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run nannyml -- --help --json

# Introspect command schema
agents-cli schema nannyml --json

# Dry-run before executing
agents-cli run nannyml -- <args> --dry-run
```
