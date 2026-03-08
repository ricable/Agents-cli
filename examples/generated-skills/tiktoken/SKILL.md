---
name: tiktoken
version: 0.0.0
description: "CLI tool: tiktoken. Use this skill when working with tiktoken-related tasks."
ingredients:
  - openai/tiktoken
tags:
  - cli
---

# tiktoken

CLI tool: tiktoken

## Usage

```bash
# Show help
tiktoken --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tiktoken -- --help --json

# Introspect command schema
agents-cli schema tiktoken --json

# Dry-run before executing
agents-cli run tiktoken -- <args> --dry-run
```
