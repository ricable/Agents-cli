---
name: ludwig
version: 0.0.0
description: "CLI tool: ludwig. Use this skill when working with ludwig-related tasks."
ingredients:
  - ludwig-ai/ludwig
tags:
  - cli
---

# ludwig

CLI tool: ludwig

## Usage

```bash
# Show help
ludwig --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ludwig -- --help --json

# Introspect command schema
agents-cli schema ludwig --json

# Dry-run before executing
agents-cli run ludwig -- <args> --dry-run
```
