---
name: adk-python
version: 0.0.0
description: "CLI tool: adk-python. Use this skill when working with adk-python-related tasks."
ingredients:
  - google/adk-python
tags:
  - cli
---

# adk-python

CLI tool: adk-python

## Usage

```bash
# Show help
adk-python --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run adk-python -- --help --json

# Introspect command schema
agents-cli schema adk-python --json

# Dry-run before executing
agents-cli run adk-python -- <args> --dry-run
```
