---
name: promptbench
version: 0.0.0
description: "CLI tool: promptbench. Use this skill when working with promptbench-related tasks."
ingredients:
  - microsoft/promptbench
tags:
  - cli
---

# promptbench

CLI tool: promptbench

## Usage

```bash
# Show help
promptbench --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run promptbench -- --help --json

# Introspect command schema
agents-cli schema promptbench --json

# Dry-run before executing
agents-cli run promptbench -- <args> --dry-run
```
