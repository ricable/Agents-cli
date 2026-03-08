---
name: prompttools
version: 0.0.0
description: "CLI tool: prompttools. Use this skill when working with prompttools-related tasks."
ingredients:
  - hegelai/prompttools
tags:
  - cli
---

# prompttools

CLI tool: prompttools

## Usage

```bash
# Show help
prompttools --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run prompttools -- --help --json

# Introspect command schema
agents-cli schema prompttools --json

# Dry-run before executing
agents-cli run prompttools -- <args> --dry-run
```
