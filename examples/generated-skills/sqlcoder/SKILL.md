---
name: sqlcoder
version: 0.0.0
description: "CLI tool: sqlcoder. Use this skill when working with sqlcoder-related tasks."
ingredients:
  - defog-ai/sqlcoder
tags:
  - cli
---

# sqlcoder

CLI tool: sqlcoder

## Usage

```bash
# Show help
sqlcoder --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run sqlcoder -- --help --json

# Introspect command schema
agents-cli schema sqlcoder --json

# Dry-run before executing
agents-cli run sqlcoder -- <args> --dry-run
```
