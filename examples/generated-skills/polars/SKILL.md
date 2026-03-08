---
name: polars
version: 0.0.0
description: "CLI tool: polars. Use this skill when working with polars-related tasks."
ingredients:
  - pola-rs/polars
tags:
  - cli
---

# polars

CLI tool: polars

## Usage

```bash
# Show help
polars --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run polars -- --help --json

# Introspect command schema
agents-cli schema polars --json

# Dry-run before executing
agents-cli run polars -- <args> --dry-run
```
