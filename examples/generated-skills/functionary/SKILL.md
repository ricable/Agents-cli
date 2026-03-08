---
name: functionary
version: 0.0.0
description: "CLI tool: functionary. Use this skill when working with functionary-related tasks."
ingredients:
  - MeetKai/functionary
tags:
  - cli
---

# functionary

CLI tool: functionary

## Usage

```bash
# Show help
functionary --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run functionary -- --help --json

# Introspect command schema
agents-cli schema functionary --json

# Dry-run before executing
agents-cli run functionary -- <args> --dry-run
```
