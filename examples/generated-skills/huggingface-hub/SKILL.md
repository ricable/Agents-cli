---
name: huggingface_hub
version: 0.0.0
description: "CLI tool: huggingface_hub. Use this skill when working with huggingface_hub-related tasks."
ingredients:
  - huggingface/huggingface_hub
tags:
  - cli
---

# huggingface_hub

CLI tool: huggingface_hub

## Usage

```bash
# Show help
huggingface_hub --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run huggingface_hub -- --help --json

# Introspect command schema
agents-cli schema huggingface_hub --json

# Dry-run before executing
agents-cli run huggingface_hub -- <args> --dry-run
```
