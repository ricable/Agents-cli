---
name: trl
version: 0.0.0
description: "CLI tool: trl. Use this skill when working with trl-related tasks."
ingredients:
  - huggingface/trl
tags:
  - cli
---

# trl

CLI tool: trl

## Usage

```bash
# Show help
trl --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run trl -- --help --json

# Introspect command schema
agents-cli schema trl --json

# Dry-run before executing
agents-cli run trl -- <args> --dry-run
```
