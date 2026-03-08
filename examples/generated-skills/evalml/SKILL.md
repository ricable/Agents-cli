---
name: evalml
version: 0.0.0
description: "CLI tool: evalml. Use this skill when working with evalml-related tasks."
ingredients:
  - alteryx/evalml
tags:
  - cli
---

# evalml

CLI tool: evalml

## Usage

```bash
# Show help
evalml --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run evalml -- --help --json

# Introspect command schema
agents-cli schema evalml --json

# Dry-run before executing
agents-cli run evalml -- <args> --dry-run
```
