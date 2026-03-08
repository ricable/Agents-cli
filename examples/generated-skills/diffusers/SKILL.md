---
name: diffusers
version: 0.0.0
description: "CLI tool: diffusers. Use this skill when working with diffusers-related tasks."
ingredients:
  - huggingface/diffusers
tags:
  - cli
---

# diffusers

CLI tool: diffusers

## Usage

```bash
# Show help
diffusers --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run diffusers -- --help --json

# Introspect command schema
agents-cli schema diffusers --json

# Dry-run before executing
agents-cli run diffusers -- <args> --dry-run
```
