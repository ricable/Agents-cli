---
name: replicate-python
version: 0.0.0
description: "CLI tool: replicate-python. Use this skill when working with replicate-python-related tasks."
ingredients:
  - replicate/replicate-python
tags:
  - cli
---

# replicate-python

CLI tool: replicate-python

## Usage

```bash
# Show help
replicate-python --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run replicate-python -- --help --json

# Introspect command schema
agents-cli schema replicate-python --json

# Dry-run before executing
agents-cli run replicate-python -- <args> --dry-run
```
