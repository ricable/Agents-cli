---
name: ControlFlow
version: 0.0.0
description: "CLI tool: ControlFlow. Use this skill when working with ControlFlow-related tasks."
ingredients:
  - PrefectHQ/ControlFlow
tags:
  - cli
---

# ControlFlow

CLI tool: ControlFlow

## Usage

```bash
# Show help
ControlFlow --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ControlFlow -- --help --json

# Introspect command schema
agents-cli schema ControlFlow --json

# Dry-run before executing
agents-cli run ControlFlow -- <args> --dry-run
```
