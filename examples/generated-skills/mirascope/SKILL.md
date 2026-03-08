---
name: mirascope
version: 2.4.0
description: "CLI tool: mirascope. Use this skill when working with mirascope-related tasks."
ingredients:
  - Mirascope/mirascope
tags:
  - cli
---

# mirascope

CLI tool: mirascope

## Usage

```bash
# Show help
mirascope --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mirascope -- --help --json

# Introspect command schema
agents-cli schema mirascope --json

# Dry-run before executing
agents-cli run mirascope -- <args> --dry-run
```
