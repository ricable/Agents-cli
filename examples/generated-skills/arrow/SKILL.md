---
name: arrow
version: 0.0.0
description: "CLI tool: arrow. Use this skill when working with arrow-related tasks."
ingredients:
  - apache/arrow
tags:
  - cli
---

# arrow

CLI tool: arrow

## Usage

```bash
# Show help
arrow --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run arrow -- --help --json

# Introspect command schema
agents-cli schema arrow --json

# Dry-run before executing
agents-cli run arrow -- <args> --dry-run
```
