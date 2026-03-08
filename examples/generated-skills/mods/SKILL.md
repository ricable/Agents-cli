---
name: mods
version: 0.0.0
description: "AI on the command line. Use this skill when working with mods-related tasks."
ingredients:
  - charmbracelet/mods
tags:
  - cli
# homepage: https://github.com/charmbracelet/mods
# license: MIT
---

# mods

AI on the command line

**Source**: https://github.com/charmbracelet/mods

## Usage

```bash
# Show help
mods --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mods -- --help --json

# Introspect command schema
agents-cli schema mods --json

# Dry-run before executing
agents-cli run mods -- <args> --dry-run
```
