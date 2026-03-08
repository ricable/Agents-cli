---
name: autogen
version: 0.0.0
description: "CLI tool: autogen. Use this skill when working with autogen-related tasks."
ingredients:
  - microsoft/autogen
tags:
  - cli
---

# autogen

CLI tool: autogen

## Usage

```bash
# Show help
autogen --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run autogen -- --help --json

# Introspect command schema
agents-cli schema autogen --json

# Dry-run before executing
agents-cli run autogen -- <args> --dry-run
```
