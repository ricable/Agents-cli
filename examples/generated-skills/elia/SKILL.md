---
name: elia
version: 0.0.0
description: "CLI tool: elia. Use this skill when working with elia-related tasks."
ingredients:
  - darrenburns/elia
tags:
  - cli
---

# elia

CLI tool: elia

## Usage

```bash
# Show help
elia --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run elia -- --help --json

# Introspect command schema
agents-cli schema elia --json

# Dry-run before executing
agents-cli run elia -- <args> --dry-run
```
