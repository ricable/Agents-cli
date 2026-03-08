---
name: timber
version: 0.0.0
description: "CLI tool: timber. Use this skill when working with timber-related tasks."
ingredients:
  - kossisoroyce/timber
tags:
  - cli
---

# timber

CLI tool: timber

## Usage

```bash
# Show help
timber --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run timber -- --help --json

# Introspect command schema
agents-cli schema timber --json

# Dry-run before executing
agents-cli run timber -- <args> --dry-run
```
