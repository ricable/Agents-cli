---
name: torchtune
version: 0.0.0
description: "CLI tool: torchtune. Use this skill when working with torchtune-related tasks."
ingredients:
  - pytorch/torchtune
tags:
  - cli
---

# torchtune

CLI tool: torchtune

## Usage

```bash
# Show help
torchtune --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run torchtune -- --help --json

# Introspect command schema
agents-cli schema torchtune --json

# Dry-run before executing
agents-cli run torchtune -- <args> --dry-run
```
