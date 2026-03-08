---
name: click
version: 0.0.0
description: "CLI tool: click. Use this skill when working with click-related tasks."
ingredients:
  - pallets/click
tags:
  - cli
---

# click

CLI tool: click

## Usage

```bash
# Show help
click --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run click -- --help --json

# Introspect command schema
agents-cli schema click --json

# Dry-run before executing
agents-cli run click -- <args> --dry-run
```
