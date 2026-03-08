---
name: ollama
version: 0.0.0
description: "CLI tool: ollama. Use this skill when working with ollama-related tasks."
ingredients:
  - ollama/ollama
tags:
  - cli
---

# ollama

CLI tool: ollama

## Usage

```bash
# Show help
ollama --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ollama -- --help --json

# Introspect command schema
agents-cli schema ollama --json

# Dry-run before executing
agents-cli run ollama -- <args> --dry-run
```
