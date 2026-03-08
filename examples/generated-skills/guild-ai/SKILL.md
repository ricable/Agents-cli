---
name: guildai
version: 0.0.0
description: "CLI tool: guildai. Use this skill when working with guildai-related tasks."
ingredients:
  - guildai/guildai
tags:
  - cli
---

# guildai

CLI tool: guildai

## Usage

```bash
# Show help
guildai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run guildai -- --help --json

# Introspect command schema
agents-cli schema guildai --json

# Dry-run before executing
agents-cli run guildai -- <args> --dry-run
```
