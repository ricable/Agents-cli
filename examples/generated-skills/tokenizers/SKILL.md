---
name: tokenizers
version: 0.0.0
description: "CLI tool: tokenizers. Use this skill when working with tokenizers-related tasks."
ingredients:
  - huggingface/tokenizers
tags:
  - cli
---

# tokenizers

CLI tool: tokenizers

## Usage

```bash
# Show help
tokenizers --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tokenizers -- --help --json

# Introspect command schema
agents-cli schema tokenizers --json

# Dry-run before executing
agents-cli run tokenizers -- <args> --dry-run
```
