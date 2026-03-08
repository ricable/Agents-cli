---
name: sdk-python
version: 0.0.0
description: "CLI tool: sdk-python. Use this skill when working with sdk-python-related tasks."
ingredients:
  - strands-agents/sdk-python
tags:
  - cli
---

# sdk-python

CLI tool: sdk-python

## Usage

```bash
# Show help
sdk-python --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run sdk-python -- --help --json

# Introspect command schema
agents-cli schema sdk-python --json

# Dry-run before executing
agents-cli run sdk-python -- <args> --dry-run
```
