---
name: vanna
version: 0.0.0
description: "CLI tool: vanna. Use this skill when working with vanna-related tasks."
ingredients:
  - vanna-ai/vanna
tags:
  - cli
---

# vanna

CLI tool: vanna

## Usage

```bash
# Show help
vanna --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run vanna -- --help --json

# Introspect command schema
agents-cli schema vanna --json

# Dry-run before executing
agents-cli run vanna -- <args> --dry-run
```
