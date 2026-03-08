---
name: pandoc
version: 0.0.0
description: "CLI tool: pandoc. Use this skill when working with pandoc-related tasks."
ingredients:
  - jgm/pandoc
tags:
  - cli
---

# pandoc

CLI tool: pandoc

## Usage

```bash
# Show help
pandoc --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pandoc -- --help --json

# Introspect command schema
agents-cli schema pandoc --json

# Dry-run before executing
agents-cli run pandoc -- <args> --dry-run
```
