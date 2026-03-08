---
name: gorilla
version: 0.0.0
description: "CLI tool: gorilla. Use this skill when working with gorilla-related tasks."
ingredients:
  - ShishirPatil/gorilla
tags:
  - cli
---

# gorilla

CLI tool: gorilla

## Usage

```bash
# Show help
gorilla --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gorilla -- --help --json

# Introspect command schema
agents-cli schema gorilla --json

# Dry-run before executing
agents-cli run gorilla -- <args> --dry-run
```
