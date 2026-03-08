---
name: Open-Assistant
version: 0.0.0
description: "CLI tool: Open-Assistant. Use this skill when working with Open-Assistant-related tasks."
ingredients:
  - LAION-AI/Open-Assistant
tags:
  - cli
---

# Open-Assistant

CLI tool: Open-Assistant

## Usage

```bash
# Show help
Open-Assistant --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run Open-Assistant -- --help --json

# Introspect command schema
agents-cli schema Open-Assistant --json

# Dry-run before executing
agents-cli run Open-Assistant -- <args> --dry-run
```
