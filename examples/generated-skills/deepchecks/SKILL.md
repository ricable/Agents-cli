---
name: deepchecks
version: 0.0.0
description: "CLI tool: deepchecks. Use this skill when working with deepchecks-related tasks."
ingredients:
  - deepchecks/deepchecks
tags:
  - cli
---

# deepchecks

CLI tool: deepchecks

## Usage

```bash
# Show help
deepchecks --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run deepchecks -- --help --json

# Introspect command schema
agents-cli schema deepchecks --json

# Dry-run before executing
agents-cli run deepchecks -- <args> --dry-run
```
