---
name: transformers
version: 0.0.0
description: "CLI tool: transformers. Use this skill when working with transformers-related tasks."
ingredients:
  - huggingface/transformers
tags:
  - cli
---

# transformers

CLI tool: transformers

## Usage

```bash
# Show help
transformers --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run transformers -- --help --json

# Introspect command schema
agents-cli schema transformers --json

# Dry-run before executing
agents-cli run transformers -- <args> --dry-run
```
