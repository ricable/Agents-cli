---
name: llama-cpp-python
version: 0.0.0
description: "CLI tool: llama-cpp-python. Use this skill when working with llama-cpp-python-related tasks."
ingredients:
  - abetlen/llama-cpp-python
tags:
  - cli
---

# llama-cpp-python

CLI tool: llama-cpp-python

## Usage

```bash
# Show help
llama-cpp-python --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llama-cpp-python -- --help --json

# Introspect command schema
agents-cli schema llama-cpp-python --json

# Dry-run before executing
agents-cli run llama-cpp-python -- <args> --dry-run
```
