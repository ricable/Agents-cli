---
name: auto-round
version: 0.0.0
description: "CLI tool: auto-round. Use this skill when working with auto-round-related tasks."
ingredients:
  - intel/auto-round
tags:
  - cli
---

# auto-round

CLI tool: auto-round

## Usage

```bash
# Show help
auto-round --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run auto-round -- --help --json

# Introspect command schema
agents-cli schema auto-round --json

# Dry-run before executing
agents-cli run auto-round -- <args> --dry-run
```
