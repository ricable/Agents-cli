---
name: reader
version: 0.0.0
description: "CLI tool: reader. Use this skill when working with reader-related tasks."
ingredients:
  - jina-ai/reader
tags:
  - cli
---

# reader

CLI tool: reader

## Usage

```bash
# Show help
reader --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run reader -- --help --json

# Introspect command schema
agents-cli schema reader --json

# Dry-run before executing
agents-cli run reader -- <args> --dry-run
```
