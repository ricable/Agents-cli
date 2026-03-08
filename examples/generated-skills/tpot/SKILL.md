---
name: tpot
version: 0.0.0
description: "CLI tool: tpot. Use this skill when working with tpot-related tasks."
ingredients:
  - EpistasisLab/tpot
tags:
  - cli
---

# tpot

CLI tool: tpot

## Usage

```bash
# Show help
tpot --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tpot -- --help --json

# Introspect command schema
agents-cli schema tpot --json

# Dry-run before executing
agents-cli run tpot -- <args> --dry-run
```
