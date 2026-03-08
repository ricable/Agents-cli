---
name: SDV
version: 0.0.0
description: "CLI tool: SDV. Use this skill when working with SDV-related tasks."
ingredients:
  - sdv-dev/SDV
tags:
  - cli
---

# SDV

CLI tool: SDV

## Usage

```bash
# Show help
SDV --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run SDV -- --help --json

# Introspect command schema
agents-cli schema SDV --json

# Dry-run before executing
agents-cli run SDV -- <args> --dry-run
```
