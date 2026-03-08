---
name: cursor
version: 0.0.0
description: "CLI tool: cursor. Use this skill when working with cursor-related tasks."
ingredients:
  - getcursor/cursor
tags:
  - cli
---

# cursor

CLI tool: cursor

## Usage

```bash
# Show help
cursor --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run cursor -- --help --json

# Introspect command schema
agents-cli schema cursor --json

# Dry-run before executing
agents-cli run cursor -- <args> --dry-run
```
