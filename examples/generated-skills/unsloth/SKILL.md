---
name: unsloth
version: 0.0.0
description: "CLI tool: unsloth. Use this skill when working with unsloth-related tasks."
ingredients:
  - unslothai/unsloth
tags:
  - cli
---

# unsloth

CLI tool: unsloth

## Usage

```bash
# Show help
unsloth --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run unsloth -- --help --json

# Introspect command schema
agents-cli schema unsloth --json

# Dry-run before executing
agents-cli run unsloth -- <args> --dry-run
```
