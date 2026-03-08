---
name: llama-agents
version: 0.0.0
description: "CLI tool: llama-agents. Use this skill when working with llama-agents-related tasks."
ingredients:
  - run-llama/llama-agents
tags:
  - cli
---

# llama-agents

CLI tool: llama-agents

## Usage

```bash
# Show help
llama-agents --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llama-agents -- --help --json

# Introspect command schema
agents-cli schema llama-agents --json

# Dry-run before executing
agents-cli run llama-agents -- <args> --dry-run
```
