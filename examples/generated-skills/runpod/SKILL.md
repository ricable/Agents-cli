---
name: runpod-python
version: 0.0.0
description: "CLI tool: runpod-python. Use this skill when working with runpod-python-related tasks."
ingredients:
  - runpod/runpod-python
tags:
  - cli
---

# runpod-python

CLI tool: runpod-python

## Usage

```bash
# Show help
runpod-python --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run runpod-python -- --help --json

# Introspect command schema
agents-cli schema runpod-python --json

# Dry-run before executing
agents-cli run runpod-python -- <args> --dry-run
```
