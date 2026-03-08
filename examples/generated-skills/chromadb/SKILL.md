---
name: chroma
version: 0.0.0
description: "CLI tool: chroma. Use this skill when working with chroma-related tasks."
ingredients:
  - chroma-core/chroma
tags:
  - cli
---

# chroma

CLI tool: chroma

## Usage

```bash
# Show help
chroma --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run chroma -- --help --json

# Introspect command schema
agents-cli schema chroma --json

# Dry-run before executing
agents-cli run chroma -- <args> --dry-run
```
