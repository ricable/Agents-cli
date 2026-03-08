---
name: prefect
version: 0.0.0
description: "CLI tool: prefect. Use this skill when working with prefect-related tasks."
ingredients:
  - PrefectHQ/prefect
tags:
  - cli
---

# prefect

CLI tool: prefect

## Usage

```bash
# Show help
prefect --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run prefect -- --help --json

# Introspect command schema
agents-cli schema prefect --json

# Dry-run before executing
agents-cli run prefect -- <args> --dry-run
```
