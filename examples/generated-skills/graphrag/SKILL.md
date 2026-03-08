---
name: graphrag
version: 0.0.0
description: "CLI tool: graphrag. Use this skill when working with graphrag-related tasks."
ingredients:
  - microsoft/graphrag
tags:
  - cli
---

# graphrag

CLI tool: graphrag

## Usage

```bash
# Show help
graphrag --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run graphrag -- --help --json

# Introspect command schema
agents-cli schema graphrag --json

# Dry-run before executing
agents-cli run graphrag -- <args> --dry-run
```
