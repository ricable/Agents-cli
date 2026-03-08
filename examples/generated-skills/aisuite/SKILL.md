---
name: aisuite
version: 0.0.0
description: "CLI tool: aisuite. Use this skill when working with aisuite-related tasks."
ingredients:
  - andrewyng/aisuite
tags:
  - cli
---

# aisuite

CLI tool: aisuite

## Usage

```bash
# Show help
aisuite --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run aisuite -- --help --json

# Introspect command schema
agents-cli schema aisuite --json

# Dry-run before executing
agents-cli run aisuite -- <args> --dry-run
```
