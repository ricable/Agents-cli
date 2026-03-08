---
name: FLAML
version: 0.0.0
description: "CLI tool: FLAML. Use this skill when working with FLAML-related tasks."
ingredients:
  - microsoft/FLAML
tags:
  - cli
---

# FLAML

CLI tool: FLAML

## Usage

```bash
# Show help
FLAML --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run FLAML -- --help --json

# Introspect command schema
agents-cli schema FLAML --json

# Dry-run before executing
agents-cli run FLAML -- <args> --dry-run
```
