---
name: vecs
version: 0.0.0
description: "CLI tool: vecs. Use this skill when working with vecs-related tasks."
ingredients:
  - supabase/vecs
tags:
  - cli
---

# vecs

CLI tool: vecs

## Usage

```bash
# Show help
vecs --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run vecs -- --help --json

# Introspect command schema
agents-cli schema vecs --json

# Dry-run before executing
agents-cli run vecs -- <args> --dry-run
```
