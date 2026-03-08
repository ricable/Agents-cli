---
name: typesense
version: 0.0.0
description: "CLI tool: typesense. Use this skill when working with typesense-related tasks."
ingredients:
  - typesense/typesense
tags:
  - cli
---

# typesense

CLI tool: typesense

## Usage

```bash
# Show help
typesense --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run typesense -- --help --json

# Introspect command schema
agents-cli schema typesense --json

# Dry-run before executing
agents-cli run typesense -- <args> --dry-run
```
