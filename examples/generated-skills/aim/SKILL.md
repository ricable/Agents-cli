---
name: aim
version: 0.0.0
description: "CLI tool: aim. Use this skill when working with aim-related tasks."
ingredients:
  - aimhubio/aim
tags:
  - cli
---

# aim

CLI tool: aim

## Usage

```bash
# Show help
aim --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run aim -- --help --json

# Introspect command schema
agents-cli schema aim --json

# Dry-run before executing
agents-cli run aim -- <args> --dry-run
```
