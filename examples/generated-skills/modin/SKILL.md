---
name: modin
version: 0.0.0
description: "CLI tool: modin. Use this skill when working with modin-related tasks."
ingredients:
  - modin-project/modin
tags:
  - cli
---

# modin

CLI tool: modin

## Usage

```bash
# Show help
modin --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run modin -- --help --json

# Introspect command schema
agents-cli schema modin --json

# Dry-run before executing
agents-cli run modin -- <args> --dry-run
```
