---
name: llmsherpa
version: 0.0.0
description: "CLI tool: llmsherpa. Use this skill when working with llmsherpa-related tasks."
ingredients:
  - nlmatics/llmsherpa
tags:
  - cli
---

# llmsherpa

CLI tool: llmsherpa

## Usage

```bash
# Show help
llmsherpa --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llmsherpa -- --help --json

# Introspect command schema
agents-cli schema llmsherpa --json

# Dry-run before executing
agents-cli run llmsherpa -- <args> --dry-run
```
