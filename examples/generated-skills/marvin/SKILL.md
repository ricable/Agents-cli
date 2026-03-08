---
name: marvin
version: 0.0.0
description: "CLI tool: marvin. Use this skill when working with marvin-related tasks."
ingredients:
  - prefecthq/marvin
tags:
  - cli
---

# marvin

CLI tool: marvin

## Usage

```bash
# Show help
marvin --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run marvin -- --help --json

# Introspect command schema
agents-cli schema marvin --json

# Dry-run before executing
agents-cli run marvin -- <args> --dry-run
```
