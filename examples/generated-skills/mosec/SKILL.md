---
name: mosec
version: 0.0.0
description: "CLI tool: mosec. Use this skill when working with mosec-related tasks."
ingredients:
  - mosecorg/mosec
tags:
  - cli
---

# mosec

CLI tool: mosec

## Usage

```bash
# Show help
mosec --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mosec -- --help --json

# Introspect command schema
agents-cli schema mosec --json

# Dry-run before executing
agents-cli run mosec -- <args> --dry-run
```
