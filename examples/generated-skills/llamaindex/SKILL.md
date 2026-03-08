---
name: llama_index
version: 0.0.0
description: "CLI tool: llama_index. Use this skill when working with llama_index-related tasks."
ingredients:
  - run-llama/llama_index
tags:
  - cli
---

# llama_index

CLI tool: llama_index

## Usage

```bash
# Show help
llama_index --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llama_index -- --help --json

# Introspect command schema
agents-cli schema llama_index --json

# Dry-run before executing
agents-cli run llama_index -- <args> --dry-run
```
