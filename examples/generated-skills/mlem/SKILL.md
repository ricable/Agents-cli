---
name: mlem
version: 0.0.0
description: "CLI tool: mlem. Use this skill when working with mlem-related tasks."
ingredients:
  - iterative/mlem
tags:
  - cli
---

# mlem

CLI tool: mlem

## Usage

```bash
# Show help
mlem --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mlem -- --help --json

# Introspect command schema
agents-cli schema mlem --json

# Dry-run before executing
agents-cli run mlem -- <args> --dry-run
```
