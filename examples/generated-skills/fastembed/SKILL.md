---
name: fastembed
version: 0.0.0
description: "CLI tool: fastembed. Use this skill when working with fastembed-related tasks."
ingredients:
  - qdrant/fastembed
tags:
  - cli
---

# fastembed

CLI tool: fastembed

## Usage

```bash
# Show help
fastembed --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run fastembed -- --help --json

# Introspect command schema
agents-cli schema fastembed --json

# Dry-run before executing
agents-cli run fastembed -- <args> --dry-run
```
