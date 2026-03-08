---
name: presidio
version: 0.0.0
description: "CLI tool: presidio. Use this skill when working with presidio-related tasks."
ingredients:
  - microsoft/presidio
tags:
  - cli
---

# presidio

CLI tool: presidio

## Usage

```bash
# Show help
presidio --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run presidio -- --help --json

# Introspect command schema
agents-cli schema presidio --json

# Dry-run before executing
agents-cli run presidio -- <args> --dry-run
```
