---
name: flux
version: 0.0.0
description: "CLI tool: flux. Use this skill when working with flux-related tasks."
ingredients:
  - black-forest-labs/flux
tags:
  - cli
---

# flux

CLI tool: flux

## Usage

```bash
# Show help
flux --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run flux -- --help --json

# Introspect command schema
agents-cli schema flux --json

# Dry-run before executing
agents-cli run flux -- <args> --dry-run
```
