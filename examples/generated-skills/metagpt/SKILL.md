---
name: MetaGPT
version: 0.0.0
description: "CLI tool: MetaGPT. Use this skill when working with MetaGPT-related tasks."
ingredients:
  - geekan/MetaGPT
tags:
  - cli
---

# MetaGPT

CLI tool: MetaGPT

## Usage

```bash
# Show help
MetaGPT --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run MetaGPT -- --help --json

# Introspect command schema
agents-cli schema MetaGPT --json

# Dry-run before executing
agents-cli run MetaGPT -- <args> --dry-run
```
