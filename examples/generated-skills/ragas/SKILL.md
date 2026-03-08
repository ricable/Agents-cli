---
name: ragas
version: 0.0.0
description: "CLI tool: ragas. Use this skill when working with ragas-related tasks."
ingredients:
  - explodinggradients/ragas
tags:
  - cli
---

# ragas

CLI tool: ragas

## Usage

```bash
# Show help
ragas --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ragas -- --help --json

# Introspect command schema
agents-cli schema ragas --json

# Dry-run before executing
agents-cli run ragas -- <args> --dry-run
```
