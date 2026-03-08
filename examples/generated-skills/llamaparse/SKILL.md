---
name: llama_parse
version: 0.0.1
description: "CLI tool: llama_parse. Use this skill when working with llama_parse-related tasks."
ingredients:
  - run-llama/llama_parse
tags:
  - cli
---

# llama_parse

CLI tool: llama_parse

## Usage

```bash
# Show help
llama_parse --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llama_parse -- --help --json

# Introspect command schema
agents-cli schema llama_parse --json

# Dry-run before executing
agents-cli run llama_parse -- <args> --dry-run
```
